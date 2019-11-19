import React from 'react'
import {TabContainer, TabMenu, Tab, TabPanel} from './TabContainer'
import {map as mapObject} from 'lodash'
import RAMLSchemaViewer from './RAMLSchemaViewer'

function Markdown(props) {
  if (!props.value) return null
  return <div className={props.className} dangerouslySetInnerHTML={{__html: props.value}}/>
}

class VerbPanel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {expanded: false}
    this.renderRequestPane = this.renderRequestPane.bind(this)
    this.renderResponseInfo = this.renderResponseInfo.bind(this)
    this.toggle = () => {
      this.setState({expanded: !this.state.expanded})
    }
    this.renderResponsePane = () => (
      <div>{mapObject(this.props.responses, this.renderResponseInfo)}</div>
    )
  }
  renderResponseInfo(response, statusCode) {
    let headers = null
    let bodies = null
    if (response.headers) {
      headers = <RAMLSchemaViewer expand={1} label='Headers' value={response.headers}/>
    }
    if (response.body) {
      bodies = response.body.map(this.renderBody, this)
    }
    return (
      <div key={statusCode}>
        <h4>
          {'HTTP Status Code '}
          <a href={`http://httpstatus.es/${statusCode}`} target='_blank'>{statusCode}</a>
        </h4>
        <Markdown value={response.description}/>
        {headers}
        {bodies}
      </div>
    )
  }
  renderBody(body, bodyIndex) {
    let typedef = null
    if (body.type === 'object') {
      typedef = <RAMLSchemaViewer expand={1} label='Body Schema' value={body}/>
    }
    let examples = null
    if (body.examples) {
      examples = new Array(body.examples.length)
      for (let index = 0; index < body.examples.length; index++) {
        examples[index] = (
          <div key={index}>
            <strong>{'Example:'}</strong>
            <Markdown value={body.examples[index].description}/>
            <pre>{body.examples[index].value}</pre>
          </div>
        )
      }
    }
    return (
      <div key={bodyIndex}>
        {typedef}
        <h4><span>{'Media Type: '}</span><code>{body.mediaType}</code></h4>
        {examples}
      </div>
    )
  }
  renderRequestPane() {
    let req = this.props
    let headers = null
    let uriParamsList = null
    let queryParamsList = null
    let bodies = null

    if (req.headers) {
      headers = <RAMLSchemaViewer expand={1} label='Headers' value={req.headers}/>
    }
    if (req.uriParameters) {
      uriParamsList = <RAMLSchemaViewer expand={1} label='URI Parameters' value={req.uriParameters}/>
    }
    if (req.queryParameters) {
      queryParamsList = <RAMLSchemaViewer expand={1} label='Query Parameters' value={req.queryParameters}/>
    }
    if (req.body) {
      bodies = req.body.map(this.renderBody, this)
    }

    return (
      <div>
        {headers}
        {uriParamsList}
        {queryParamsList}
        {bodies}
      </div>
    )
  }
  render() {
    let {responses, method} = this.props
    let hasRequest = this.props.body || this.props.uriParameters || this.props.queryParameters
    let role = this.props['(role)']
    return <div className={'verb-panel -' + method}>
      <button type='button' className='header' onClick={this.toggle}>
        <span className='verb'>{method + ' '}</span>
        {role && <small className='pull-right'>
          <i className='fa fa-lock'/>{' ' + this.props['(role)']}
        </small>}
      </button>
      {this.state.expanded && <div className='body'>
        <Markdown value={this.props.description}/>
        <TabContainer labels={['Request', 'Response']} defaultTab={hasRequest ? 0 : 1}>
          <TabMenu>
            <Tab disabled={!hasRequest}>{'Request'}</Tab>
            <Tab disabled={!responses}>{'Response'}</Tab>
          </TabMenu>
          <TabPanel render={this.renderRequestPane}/>
          <TabPanel render={this.renderResponsePane}/>
        </TabContainer>
      </div>}
    </div>
  }
}

class RoutePanel extends React.Component {
  renderVerb(info, key) {
    return <VerbPanel {...info} key={key}/>
  }
  render() {
    let {path, description, verbs} = this.props
    return (
      <div id={path} className='panel panel-default route-panel'>
        <div className='panel-heading'>
          <a href={'#' + path}><i className='fa fa-link'/></a>
          <span className='path'>{path}</span>
        </div>
        <div className='panel-body'>
          <Markdown value={description}/>
          <div className='verbs'>
            {mapObject(verbs, this.renderVerb)}
          </div>
        </div>
      </div>
    )
  }
}

export default class App extends React.Component {
  render() {
    let {title, version, description, routes} = this.props.api
    return <div className='container'>
      <div className='page-header'>
        <h1>{title} <small>{'v' + version}</small></h1>
        <Markdown value={description}/>
      </div>
      <div className='alert alert-info'>
        {' ⌘/ctrl or shift click schema nodes to expand multiple levels'}
      </div>
      {routes.map((item, index) => <RoutePanel {...item} key={index} />)}
    </div>
  }
}
