import React from 'react'

export default class Table extends React.PureComponent {
  renderRows(WrapperType, RowType, ColType, rows) {
    if (!rows) return null
    let elements = rows.map((row, ri) => {
      let cols = row.map((col, ci) => <ColType key={ci}>{col}</ColType>)
      return <RowType key={ri}>{cols}</RowType>
    })
    return <WrapperType>{elements}</WrapperType>
  }
  render() {
    let header = this.renderRows('thead', 'tr', 'th', this.props.header)
    let body = this.renderRows('tbody', 'tr', 'td', this.props.body)
    let footer = this.renderRows('tfoot', 'tr', 'th', this.props.footer)
    return (
      <div className='table-responsive'>
        <table className='table table-condensed' summary={this.props.summary ? this.props.summary : null}>
          {header}
          {body}
          {footer}
        </table>
      </div>
    )
  }
}
