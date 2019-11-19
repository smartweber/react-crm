'use strict'
import React from 'react'
import {Info} from './misc'
import { withRouter } from 'react-router-dom'
import api from '../api'

export class IntegrationError extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: null,
      message: null
    }
  }
  componentDidMount() {
    let loading = api.orgs.getErrorMsg({errorId: this.props.match.params.errorId}).then((res) => {
      console.log(res)
      this.setState({
        loading: null,
        message: res['message']
      })
    }).catch(() => {
      this.setState({
        loading: null,
        message: ''
      })
    })

    this.setState({loading})
  }
  render() {
    let {loading, message} = this.state
    return <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {loading ?
      <i aria-hidden='true' className='fa fa-3x fa-spin fa-spinner'/> :
      <Info>
      {message ?
        message :
        'The LMS could not connect. Please try again.'}
      </Info>
      }
    </div>
  }
}

export default withRouter(IntegrationError)