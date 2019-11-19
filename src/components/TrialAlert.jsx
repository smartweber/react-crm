import React from 'react'
import Link from 'react-router-dom/Link'
import {Button} from './misc'
import {withRouter} from 'react-router-dom'

class TrialAlert extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this)
  }
  handleClick = () => {
    this.props.history.push('/settings/profile');
  }
  render() {
    let {actionTitle, actionLabel} = this.props
    return (
      <div className='trial-alert alert'>
        <div>{this.props.children}</div>
        <div className='action'>
          {actionTitle}
          <Button className='btn-primary' label={actionLabel} onClick={this.handleClick}/>
        </div>
      </div>
    )
  }
}

export default withRouter(TrialAlert)
