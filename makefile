SHELL := /usr/bin/env bash

# Possible build artifacts
BUILD_DIR     := ./dist
HTML_FILE     := $(BUILD_DIR)/index.html
CSS_BUNDLE    := $(BUILD_DIR)/index.css
JS_BUNDLE     := $(BUILD_DIR)/index.js
BABEL_HELPERS := $(BUILD_DIR)/babel-helpers.js
STATIC_FILES  := $(BUILD_DIR)/static
DOC_HTML_FILE := $(BUILD_DIR)/spec.html
DOC_CSS_BUNDLE:= $(BUILD_DIR)/spec.css
DOC_JS_BUNDLE := $(BUILD_DIR)/spec.js

prod: clean $(BABEL_HELPERS) $(CSS_BUNDLE) $(STATIC_FILES) $(HTML_FILE) ## Production build (default)
	node_modules/.bin/browserify \
	--entry $(BABEL_HELPERS) \
	--entry src/render-dom.js \
	--require lodash/assign.js:object-assign \
	--require bluebird/js/browser/bluebird.min.js:bluebird \
	--transform babelify \
	--global-transform [loose-envify purge] \
	--plugin bundle-collapser/plugin \
	--extension .jsx \
	| node_modules/.bin/uglifyjs -mc warnings=false >$(JS_BUNDLE) \
	; test $${PIPESTATUS[0]} -eq 0
	cp images/favicon.ico $(BUILD_DIR)/
	cp src/robots.txt $(BUILD_DIR)/
	rm $(BABEL_HELPERS)
	gzip -kf $(CSS_BUNDLE) $(JS_BUNDLE)
	@du -sh $(BUILD_DIR)/*

api-spec: $(BABEL_HELPERS) $(DOC_CSS_BUNDLE) $(STATIC_FILES) $(DOC_HTML_FILE) ## Generate REST API documentation
	NODE_ENV=production node_modules/.bin/browserify \
	--entry $(BABEL_HELPERS) \
	--entry src/render-dom-spec.js \
	--require lodash/assign.js:object-assign \
	--require bluebird/js/browser/bluebird.min.js:bluebird \
	--transform babelify \
	--global-transform [loose-envify purge] \
	--plugin bundle-collapser/plugin \
	--extension .jsx \
	| node_modules/.bin/uglifyjs -mc warnings=false >$(DOC_JS_BUNDLE) \
	; test $${PIPESTATUS[0]} -eq 0
	mkdir $(BUILD_DIR)/api{,/static}
	cp $(STATIC_FILES)/*.woff $(BUILD_DIR)/api/static
	cp -r $(DOC_HTML_FILE) $(DOC_CSS_BUNDLE) $(DOC_JS_BUNDLE) $(BUILD_DIR)/api
	cd $(BUILD_DIR) && tar -czf api.tgz -api && rm -r api
	mv $(BUILD_DIR)/api{,.$(shell date "+%Y-%m-%d")}.tgz

dev: clean $(STATIC_FILES) $(HTML_FILE) ## Development build plus file server and automatic rebuild & refresh
	node_modules/.bin/rum $(BUILD_DIR) $(JS_BUNDLE) \
	--router /index.html \
	--port $(PORT) \
	-w 'src/**/*.scss' -x 'make $(CSS_BUNDLE)' \
	-- \
	--entry src/debug.js \
	--entry src/render-dom.js \
	--transform babelify \
	--global-transform [loose-envify purge] \
	--extension .jsx \
	--debug

deploy:
	aws s3 sync $(BUILD_DIR) 's3://$(AWS_S3_BUCKET)' \
	--no-progress \
	--exclude '*.gz' \
	--exclude 'static/**' \
	--storage-class 'REDUCED_REDUNDANCY' \
	--cache-control 'public, max-age=$(AWS_S3_CACHE_CONTROL)' \
	--delete
	aws s3 sync $(STATIC_FILES) 's3://$(AWS_S3_BUCKET)/static' \
	--no-progress \
	--exclude '*.gz' \
	--storage-class 'REDUCED_REDUNDANCY' \
	--cache-control 'public, max-age=$(AWS_S3_CACHE_CONTROL)' \
	--size-only \
	--delete
	aws cloudfront create-invalidation \
	--distribution-id '$(AWS_CLOUDFRONT_ID)' \
	--paths '/*'

MOCHA_OPT := test/*.{js,jsx} -br babel-core/register
test-watch: ## Run the test suite and watch for changes
	node_modules/.bin/chokidar test src --initial --silent \
	-c 'node_modules/.bin/mocha $(MOCHA_OPT) -R min'
test-debug: ## Run the test suite with node-inspector
	node --inspect --debug-brk node_modules/.bin/_mocha $(MOCHA_OPT)
test: ## Run the test suite (e.g. for the CI server)
	node_modules/.bin/mocha $(MOCHA_OPT) -R tap

clean: ## Remove build artifacts
	rm -rf $(BUILD_DIR)

list: ## Print each file in the dependency graph
	@node_modules/.bin/browserify --list \
	--entry src/render-dom.js \
	--detect-globals=false \
	--transform babelify \
	--extension .jsx \
	| sed "s#$(PWD)/##"

help: ## You're looking at it
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

$(BUILD_DIR):
	mkdir -p $@
$(HTML_FILE): $(BABEL_HELPERS)
	LOG_LEVEL=warn \
	node --require babel-core/register --require $(BABEL_HELPERS) src/render-string.js >$@
$(BABEL_HELPERS): | $(BUILD_DIR)
	node_modules/.bin/babel-external-helpers -t global >$@
$(CSS_BUNDLE): $(shell find src -name '*.scss') | $(BUILD_DIR)
	node_modules/.bin/node-sass src/styles/index.scss >$@ \
	--include-path node_modules \
	--importer sass-importer.js \
	$(shell [[ '$(NODE_ENV)' == 'production' ]] && echo --output-style compressed || echo --source-map-embed --source-map-contents)
$(STATIC_FILES): node_modules/font-awesome/fonts/*.woff images/*.png
	mkdir -p $@
	@cp $? $@
$(DOC_CSS_BUNDLE): $(shell find src -name '*.scss') | $(BUILD_DIR)
	node_modules/.bin/node-sass src/styles/index-spec.scss >$@ \
	--include-path node_modules \
	--importer sass-importer.js \
	$(shell [[ '$(NODE_ENV)' == 'production' ]] && echo --output-style compressed || echo --source-map-embed --source-map-contents)
$(DOC_HTML_FILE): $(BABEL_HELPERS) | $(BUILD_DIR)
	LOG_LEVEL=warn \
	node --require babel-core/register --require $(BABEL_HELPERS) src/render-string-spec.js >$@

.PHONY: prod dev api-spec deploy test test-watch test-debug clean list help
