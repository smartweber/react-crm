import React from 'react'
import PropTypes from 'prop-types'
import PageButtons from './PageButtons'
import * as util from '../util/helpers'

/**
 * Display a list of search results
 * - with pagination
 */
export default class SearchResults extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      page: 0
    }
    util.autobind(this, ['showPage', 'click', 'enter'])
  }

  showPage(dir) {
    this.setState({page: this.state.page + dir})
  }

  click(evt) {
    evt.preventDefault()
    let index = evt.target.getAttribute('data-index')
    this.props.onClick(this.props.items[index])
  }

  enter(evt) {
    if (evt.key === 'Enter') this.click(evt)
  }

  render() {
    const {limit, items, className} = this.props
    const {page} = this.state
    const offset = page * limit
    const view = items.slice(offset, offset+limit).map((rec, index) => (
      <li key={index}>
        <span className='link'
          data-index={index}
          tabIndex='0'
          onKeyPress={this.enter}
          onClick={this.click}
        >{rec.name}</span>
      </li>
    ))
    return <div className={className}>
      <ul className='list-unstyled'>{view}</ul>
      <PageButtons
        more={items.length - offset > limit}
        less={page > 0}
        onChange={this.showPage}
      />
    </div>
  }
}

SearchResults.propTypes = {
  // List of search-result objects
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
  })),

  // Number of items per page
  limit: PropTypes.number.isRequired,

  /**
   * @param {object} item
   */
  onClick: PropTypes.func.isRequired,
}
