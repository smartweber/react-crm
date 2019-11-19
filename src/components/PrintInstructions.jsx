import React from 'react'
import PropTypes from 'prop-types'
import {Info, Button} from './misc'
import Modal from './Modal'

export default class PrintInstructions extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    canFill: PropTypes.bool,
    canDownload: PropTypes.bool,
  }
  constructor(props) {
    super(props)
    this.state = {fill: false}
    this.toggleFilled = (evt) => {
      this.setState({fill: evt.currentTarget.checked})
    }
    this.submit = () => {
      this.props.onSubmit(this.state.fill)
    }
  }
  render() {
    let {onClose, ltiLaunchActive, canFill, canDownload, isUpcomingExam, preloadPdfPending} = this.props
    let {fill} = this.state
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='print-instructions' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Printing Instructions'}</h4>
        <div className='body'>
          <img src='/static/print.png'/>
          <ol>
            <li>{'Each answer sheet must be printed with a black bracket showing in all four corners.'}</li>
            <li>{'A sheet is valid only for a particular exam. Ensure you bring the correct sheet.'}</li>
            <li>{'Answer sheets may be printed in B&W or color but make sure you have enough ink to avoid streaks.'}</li>
          </ol>
          <p>{'If your sheet has missing brackets, is for the wrong test, or was printed while low on ink, your test will not be scored.'}</p>
          <div className='alert alert-info alert-scale'>
            <i className='fa fa-lg fa-info-circle'/>
            {' use the "scale to fit" setting.'}
          </div>
          <div className="clear"></div>
          {!isUpcomingExam && <Info>
            {'Are you sure this answer sheet is for the correct exam? If you use an answer sheet for the incorrect exam, your answer sheet will not be scored.'}
          </Info>}
          <div className='btn-group'>
            {canFill && <div className='checkbox pull-right'>
              <label>
                <input type='checkbox' checked={fill} onChange={this.toggleFilled}/>
                {'Pre-fill Student IDs'}
              </label>
            </div>}
            <Button className={!isUpcomingExam ? 'btn-primary' : ''} label='Close' onClick={onClose} loading={preloadPdfPending}/>
            <Button className={isUpcomingExam ? 'btn-primary' : ''} label='Download' disabled={!canDownload || preloadPdfPending}
              onClick={this.submit}/>
            <div style={{clear: 'both'}}/>
          </div>
        </div>
      </Modal>
    )
  }
}
