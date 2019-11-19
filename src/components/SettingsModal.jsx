import React from 'react'
import Modal from './Modal'
import SecretInput from './SecretInput'
import ConfirmationModal from './ConfirmationModal'
import Select from './Select'
import PropTypes from 'prop-types'
import {Button, Info} from './misc'
import api from '../api'
const BASE_URL = process.env.API_ORIGIN
const LMSS = [
  {
    label: 'Canvas',
    value: 'canvas'
  },
  {
    label: 'BlackBoard Learn',
    value: 'blackboard'
  },
  {
    label: 'Moodle',
    value: 'moodle',
    disabled: true
  },
  {
    label: 'Desire2Learn',
    value: 'd2l',
    disabled: true
  }
]

export default class SettingsModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      consumerKey: '',
      sharedSecret: '',
      clientId: '',
      secret: '',
      apiUrl: '',
      currentLMS: LMSS[0],
      loading: false,
      lmsLoading: null,
      err: null,
      confirm: false,
      activated: false,
      credentialLoading: false,
      integrationLoading: false
    }
    this._pending = null
    this.toggleConfirm = this.toggleConfirm.bind(this)
    this.generateLTI = this.generateLTI.bind(this)
    this.onActivate = this.onActivate.bind(this)
    this.onSecretInputChange = this.onSecretInputChange.bind(this)
    this.onChangeLMSType = this.onChangeLMSType.bind(this)
  }
  componentDidMount() {
    let {orgId} = this.props
    let loading = Promise.all([
      api.orgs.getLtiCredential({orgId}),
      api.orgs.getLtiIntegration({orgId, lmsType: LMSS[0]['value']})
    ]).then(res => {
      this.setState({
        consumerKey: res[0]['consumerKey'] ? res[0]['consumerKey'] : '',
        sharedSecret: res[0]['sharedSecret'] ? res[0]['sharedSecret'] : '',
        clientId: res[1]['clientId'] ? res[1]['clientId'] : '',
        secret: res[1]['secret'] ? res[1]['secret'] : '',
        apiUrl: res[1]['apiUrl'] ? res[1]['apiUrl'] : '',
        activated: res[1]['activated'] ? true : false,
        loading: null,
        err: null
      })
    })
    .catch(() => {
      this.setState({
        loading: null,
        err: 'You can not get credentials, please try again later.'
      })
    });
    this.setState({loading})
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  toggleConfirm() {
    this.setState({confirm: this.state.confirm ? false : true})
  }
  onActivate() {
    let {orgId, onClose} = this.props
    let {clientId, secret, apiUrl, currentLMS} = this.state
    if (!clientId || !secret || !apiUrl) {
      this.setState({
        integrationLoading: false,
        err: 'The fields are required for activation.'
      })
      return;
    }

    switch (currentLMS) {
      case LMSS[0]: // Canvas
        const windowName = 'userConsole';
        const popUp = window.open(`${apiUrl}/login/oauth2/auth?client_id=${clientId}&response_type=code&state=${orgId}-canvas&redirect_uri=${BASE_URL}/lti/organizations/integrations/oauth_response`, windowName, 'width=1000, height=700, left=24, top=24, scrollbars, resizable');
        if (popUp == null || typeof(popUp)=='undefined') { 	
          alert('Please disable your pop-up blocker.')
        } else { 	
          this.setState({integrationLoading: true})
          api.orgs.genrateLtiIntegration({
            orgId,
            lmsType: currentLMS['value'],
            clientId,
            secret,
            apiUrl
          }).then(() => {
            popUp.focus()
            this.setState({integrationLoading: false})
            onClose()  
          }).catch(() => {
            this.setState({
              integrationLoading: false,
              err: 'Fail to save lms credential.'
            })
          })
        }
        break

      case LMSS[1]: // BlackBoard Learn
        this.setState({integrationLoading: true})
        api.orgs.genrateLtiIntegration({
          orgId,
          lmsType: currentLMS['value'],
          clientId,
          secret,
          apiUrl
        }).then(() => {
          this.setState({integrationLoading: false})
          onClose()  
        }).catch(() => {
          this.setState({
            integrationLoading: false,
            err: 'Fail to save blackboard credential.'
          })
        })
        break
    }
  }
  onSecretInputChange(value) {
    this.setState({...value})
  }
  onChangeLMSType(event) {
    let {orgId} = this.props
    this.setState({
      currentLMS: event
    })
    let lmsLoading = api.orgs.getLtiIntegration({orgId, lmsType: event['value']})
      .then((res) => {
        this.setState({
          clientId: res && res['clientId'] ? res['clientId'] : '',
          secret: res && res['secret'] ? res['secret'] : '',
          apiUrl: res && res['apiUrl'] ? res['apiUrl'] : '',
          activated: res && res['activated'] ? true : false,
          lmsLoading: null,
          err: null
        })
      }).catch(() => {
        this.setState({
          lmsLoading: null,
          err: 'You can not get credentials, please try again later.'
        })
      })
    this.setState({lmsLoading})
  }
  generateLTI() {
    let {orgId} = this.props
    this.setState({credentialLoading: true})
    return api.orgs.generateLtiCredential({orgId}).then(data => {
      this.setState({
        consumerKey: data['consumerKey'],
        sharedSecret: data['sharedSecret'],
        credentialLoading: false,
        confirm: false
      })
      return null
    }).catch(() => {
      this.setState({
        credentialLoading: false,
        confirm: false,
        err: 'Fail to generate LTI launch credential.'
      })
    })
  }
  render() {
    let {onClose} = this.props
    let {loading, lmsLoading, consumerKey, sharedSecret, clientId, secret, apiUrl, confirm, activated, credentialLoading, integrationLoading, err, currentLMS} = this.state
    if (loading) return <Modal isOpen loading onRequestClose={onClose}/>
    return <Modal className='-setting' isOpen onRequestClose={onClose}>
      <h4 className='header' aria-level='2'>{'Learning Tools Interoperability (LTI)'}</h4>
      <div className='body'>
        <div className='description'>
          <p>{'We have a number of integrations that you can use to integrate date to and from into other platforms.'}</p>
          <p>
            <a>{'For the most up to date list of integrations please visit our developers & integrations page.'}</a>
          </p>
        </div>
        <h4 aria-level='2'>{'LTI Launch'}</h4>
        <div className='secret-container'>
          <SecretInput
            label={'Consumer Key'}
            value={consumerKey}
            ariaLabel='Consumer Key'
            readOnly
          />
          <SecretInput 
            label={'Shared Secret'}
            value={sharedSecret}
            ariaLabel='Shared Secret'
            readOnly            
          />
          <Button className='btn-primary' label='Generate' onClick={this.toggleConfirm} loading={credentialLoading} />
        </div>
        <h4 aria-level='2'>{'LMS Integrations'}</h4>
        <div className='canvas-lms-container'>
          <div className='form-group'>
            <Select labeler='label' role='listbox' opt={LMSS} value={currentLMS} onChange={this.onChangeLMSType}/>
          </div>
          <SecretInput
            label={'Client ID'}
            value={clientId}
            name={'clientId'}
            copyTxtTabIndex='0'
            onSecretInputChange={this.onSecretInputChange}
          />
          <SecretInput
            label={'Secret'}
            value={secret}
            name={'secret'}
            copyTxtTabIndex='0'
            onSecretInputChange={this.onSecretInputChange}
          />
          <SecretInput
            label={'URL'}
            value={apiUrl}
            name={'apiUrl'}
            copyTxtTabIndex='0'
            onSecretInputChange={this.onSecretInputChange}
          />
        </div>
        {err && <Info>{err}</Info>}
      </div>
      <div className='footer'>
        <div className='btn-group pull-left'>
          <Button className={activated ? 'btn-warning' : 'btn-primary'} label={activated ? 'Reset' : 'Activate'} onClick={this.onActivate} loading={integrationLoading} disabled={lmsLoading}/>
        </div>
        <div className='btn-group pull-right'>
          <Button label='Cancel' onClick={onClose} disabled={lmsLoading}/>
        </div>
        <div style={{clear: 'both'}}></div>
      </div>
      {confirm && <ConfirmationModal onClose={this.toggleConfirm} onSubmit={this.generateLTI}>
        <p>
          {'This will create LTI keys for your Organization, or reset any existing ones, Proceed?'}
        </p>
      </ConfirmationModal>}
    </Modal>
  }
}

SettingsModal.propTypes = {
  orgId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}
