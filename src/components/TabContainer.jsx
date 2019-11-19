import React from 'react'
import PropTypes from 'prop-types'

/**
 * TODO aria-controls='$panelID'
 * TODO arrow keys
 * Extensible, ARIA compatible, component for tabbed panes
 * @example
 *   <TabContainer>
 *     <TabMenu>
 *       <Tab>{'Tab 1'}</Tab>
 *       <Tab>{'Tab 2'}</Tab>
 *     </TabMenu>
 *     <TabPanel>{'Panel 1'}</TabPanel>
 *     <TabPanel>{'Panel 2'}</TabPanel>
 *   </TabContainer>
 */
export class TabContainer extends React.PureComponent {
  constructor(props) {
    super(props)
    this.click = this.click.bind(this)
    const index = props.defaultTab || 0
    this.state = {index}
    this.props.onSelect(index)
  }
  click(evt) {
    let index = parseInt(evt.currentTarget.getAttribute('data-value'))
    if (index !== this.state.index) {
      this.setState({index})
      this.props.onSelect(index)
    }
  }
  render() {
    let menu = React.cloneElement(this.props.children[0], {
      selectedIndex: this.state.index,
      onClick: this.click,
    })
    let selectedPanel = this.props.children[this.state.index + 1]
    return React.createElement('div', {
      className: 'tab-container'
    }, menu, selectedPanel)
  }
}
TabContainer.propTypes = {
  defaultTab: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  children: ({children}, propName, componentName) => {
    let count = React.Children.count(children)
    if (count < 2) {
      return new Error(`${componentName} must have at least 2 children (header + panels)`)
    }
  }
}

export function Tab(props) {
  return React.createElement('button', {
    type: 'button',
    role: 'tab',
    className: 'tab-menuitem',
    disabled: props.disabled,
    'aria-selected': props.active,
    'data-value': props.value,
    onClick: props.onClick,
  }, props.children)
}

export function TabMenu(props) {
  let children = React.Children.map(props.children, (child, index) => React.cloneElement(child, {
    active: index === props.selectedIndex,
    value: index,
    onClick: props.onClick,
  }))
  return <div role='tablist' className='tab-menu tabList'>{children}</div>
}

export function TabPanel(props) {
  return (
    <div role='tabpanel' className='tab-panel'>{props.render()}</div>
  )
}
TabPanel.propTypes = {
  render: PropTypes.func.isRequired
}
