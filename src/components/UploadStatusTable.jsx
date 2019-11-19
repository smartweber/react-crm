import React from 'react'
import PropTypes from 'prop-types'
import api from '../api'
import Modal from './Modal'
import {Info, Button} from './misc'
import {CarouselProvider, Slider, Slide, ButtonBack, ButtonNext} from 'pure-react-carousel'

export default class UploadStatusTable extends React.Component {
    constructor(props) {
        super(props)
        this.renderTable = this.renderTable.bind(this)
        this.renderStatus = this.renderStatus.bind(this)
        this.toggleAnalysisModal = this.toggleAnalysisModal.bind(this)
        this.toggleScoringModal = this.toggleScoringModal.bind(this)
        this.toggleModal = this.toggleModal.bind(this)
        this.toggleUnScoringViewModal = this.toggleUnScoringViewModal.bind(this)
        this.onResume = this.onResume.bind(this)
        this.state = {
            uploads: [],
            loading: true,
            resumeAnalysis: false,
            resumeProcess: false,
            openedModal: false,
            err: null
        }
    }

    componentDidMount() {
        let {data} = this.props
        this.setUploads(data)
    }

    componentWillReceiveProps() {
        let {data} = this.props
        if (!this.state.openedModal) {
            this.setUploads(data)
        }
    }

    setUploads(propsData) {
        if (propsData && propsData.length > 0) {
            let uploads = propsData.map((upload, index) => {
                //transformation
                let transformationStatus = 'process'
                if (upload.convertStart && upload.convertModule) {
                    transformationStatus = 'success'
                }
                //analysis
                let analysisStatus = 'none'
                if (upload.convertStart) {
                    analysisStatus = 'process'
                }
                if (upload.uploadStart && upload.uploadModule && (Number.isInteger(upload.duplicateCount) || upload.pollerStart)) {
                    analysisStatus = upload.duplicateCount > 0 ? 'error' : 'success'
                }
                // scoring
                let scoringStatus = 'none'
                if (upload.uploadStart) {
                    scoringStatus = 'process'
                }
                if (upload.pollerStart && upload.pollerModule) {
                    scoringStatus = upload.nonFormCount > 0 ? 'error' : 'success'
                }
                //imagin
                let imaginStatus = 'none'
                if (upload.pollerStart) {
                    imaginStatus = 'process'
                }
                if (upload.imagingStart && upload.imagingModule) {
                    imaginStatus = 'success'
                }

                return {
                    index: index,
                    fileName: upload.fileTag,
                    batchNumber: upload.batchId,
                    transformation: {
                        status: transformationStatus
                    },
                    analysis: {
                        status: analysisStatus,
                        openAlertModal: false
                    },
                    scoring: {
                        status: scoringStatus,
                        counter: upload.nonFormCount,
                        nonFormImgs: upload.nonFormImgs ? upload.nonFormImgs : [],
                        openAlertModal: false,
                        openViewModal: false
                    },
                    imagin: {
                        status: imaginStatus
                    },
                    finished: {
                        status: upload.imagingModule && upload.validSheetCount !== null ? 'success' : 'none',
                        counter: upload.validSheetCount
                    }
                }
            })

            this.setState({loading: false, err: null, uploads})
        } else {
            this.setState({loading: false, err: null, uploads: []})
        }
    }

    renderStatus(type, data, index) {
        let isSup = false
        let icon = <i aria-hidden='true' className='fa fa-lg fa-check'/>
        let recommendation = null

        switch (data.status) {
            case 'success':
                icon = <i aria-hidden='true' className='fa fa-lg fa-check'/>
                recommendation = <span className='sr-only'>Completed</span>
                if (type === 'finished') {
                    isSup = true
                }
                break
            
            case 'process':
                icon = <i className='fa fa-lg fa-spinner fa-spin'></i>
                recommendation = <span className='sr-only'>In Progress</span>
                isSup = false
                break
            
            case 'error':
                icon = <i className="fa fa-lg fa-exclamation" aria-hidden="true" onClick={() => this.toggleModal(type, index)}></i>
                if (type === 'scoring') {
                    isSup = true
                }
                break
        
            default:
                icon = null
                isSup = false
                break
        }

        return(
            <div className='content-wrapper'>
                {icon}
                {isSup ? <sup>{data.counter}</sup> : null}
                {recommendation}
            </div>
        )
    }

    toggleModal(type, uploadIndex) {
        if (type === 'analysis') {
            this.toggleAnalysisModal(uploadIndex)
        } else if (type === 'scoring') {
            this.toggleScoringModal(uploadIndex)
        }
    }

    toggleAnalysisModal(uploadIndex) {
        this.setState({openedModal: false})
        let uploads = this.state.uploads
        for (let i = 0; i < uploads.length; i ++) {
            if (uploads[i].index === uploadIndex) {
                uploads[i].analysis.openAlertModal = !uploads[i].analysis.openAlertModal
                if (uploads[i].analysis.openAlertModal) this.setState({openedModal: true})
                break
            }
        }
        this.setState({uploads})
    }

    toggleScoringModal(uploadIndex) {
        this.setState({openedModal: false})
        let uploads = this.state.uploads
        for (let i = 0; i < uploads.length; i ++) {
            if (uploads[i].index === uploadIndex) {
                uploads[i].scoring.openAlertModal = !uploads[i].scoring.openAlertModal
                if (uploads[i].scoring.openAlertModal) this.setState({openedModal: true})
                break
            }
        }
        this.setState({uploads})
    }

    toggleUnScoringViewModal(uploadIndex) {
        let uploads = this.state.uploads
        for (let i = 0; i < uploads.length; i ++) {
            if (uploads[i].index === uploadIndex) {
                uploads[i].scoring.openAlertModal = false
                uploads[i].scoring.openViewModal = !uploads[i].scoring.openViewModal
                break
            }
        }
        this.setState({uploads})
    }

    onResume(batchId, index) {
        this.setState({resumeProcess: true})
        api.exams.resumeBatch({batchId})
        .then(() => {
            this.setState({resumeProcess: false})
            this.toggleAnalysisModal(index)
        }).catch(() => {
            this.setState({
                resumeProcess: false,
                resumeAnalysis: true
            })
        })
    }

    renderTable(uploads) {
        let {ltiLaunchActive} = this.props
        let {resumeProcess, resumeAnalysis} = this.state
        let rows = uploads.map((upload) => (
            <tr key={upload.index}>
                <td style={{width: '20%'}}>
                    <div className='content-wrapper'>
                        {upload.fileName}
                    </div>
                </td>
                <td style={{width: '20%'}}>
                    <div className='content-wrapper'>
                        {upload.batchNumber}
                    </div>
                </td>
                <td style={{width: '12%'}}>
                    {this.renderStatus('transformation', upload.transformation)}
                </td>
                <td style={{width: '12%'}}>
                    {this.renderStatus('analysis', upload.analysis, upload.index)}
                    {(upload.analysis.status === 'error' && upload.analysis.openAlertModal) && <AnalysisModal ltiLaunchActive={ltiLaunchActive} resumeProcess={resumeProcess} resumeAnalysis={resumeAnalysis} onClose={() => this.toggleAnalysisModal(upload.index)} onResume={() => this.onResume(upload.batchNumber, upload.index)} />}
                </td>
                <td style={{width: '12%'}}>
                    {this.renderStatus('scoring', upload.scoring, upload.index)}
                    {(upload.scoring.status === 'error' && upload.scoring.openAlertModal) && <ScoringModal ltiLaunchActive={ltiLaunchActive} onUnScoredView={() => this.toggleUnScoringViewModal(upload.index)} onClose={() => this.toggleScoringModal(upload.index)} />}
                    {(upload.scoring.status === 'error' && upload.scoring.openViewModal) && <UnScoredExamViewModal ltiLaunchActive={ltiLaunchActive} nonFormImgs={upload.scoring.nonFormImgs} onClose={() => this.toggleUnScoringViewModal(upload.index)} />}
                </td>
                <td style={{width: '12%'}}>
                    {this.renderStatus('imagin', upload.imagin)}
                </td>
                <td style={{width: '12%'}}>
                    {this.renderStatus('finished', upload.finished)}
                </td>
            </tr>
        ))
        return(
            <table className='table' summary='The upload status table monitors the processing of answer sheets.'>
                <thead>
                    <tr>
                        <th>{'File'}</th>
                        <th>{'Batch#'}</th>
                        <th>{'Convert'}</th>
                        <th>{'Analyze'}</th>
                        <th>{'Score'}</th>
                        <th>{'Images'}</th>
                        <th>{'Finished'}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
    

    render() {
        let {ltiLaunchActive, onClose} = this.props
        let {uploads} = this.state

        return (
            <Modal ltiLaunchActive={ltiLaunchActive} className='upload-status' isOpen onRequestClose={onClose}>
                <h4 className='header' aria-level='2'>{'Upload Status'}</h4>
                <div className='body'>
                    <div className='table-responsive'>
                        {this.renderTable(uploads)}
                    </div>
                </div>
                <div className='footer'>
                    <div className='btn-group pull-right'>
                        <Button className='btn-default' label='Close' onClick={onClose}/>
                    </div>
                    <div style={{clear: 'both'}}/>
                </div>
            </Modal>
        )
    }
}

UploadStatusTable.propTypes = {
    onClose: PropTypes.func.isRequired,
}

class AnalysisModal extends React.Component {
    render() {
        let {resumeProcess, resumeAnalysis, onClose, onResume, ltiLaunchActive} = this.props
        return (
            <Modal isOpen className='-center analysis-modal' ltiLaunchActive={ltiLaunchActive} onRequestClose={onClose}>
                <h4 className='header' aria-level='2'>{'Analysis'}</h4>
                <div className='body'>
                    {resumeProcess ? 
                    <div className='content spinner'>
                        <i className='fa fa-lg fa-spin fa-spinner'/>
                    </div> : 
                    <div>
                        <div className='content'>{'Click resume to score exams'}</div>
                        {resumeAnalysis ? <Info>{'We encountered an issue releasing your batch. Please contact Support if the problem persists.'}</Info> : null}
                    </div>
                    }
                </div>
                <div className='footer'>
                    <div className='btn-group btn-center'>
                        <Button className='btn-default' label='Close' onClick={onClose} />
                        <Button disabled={resumeProcess} className='btn-primary' label='Resume' onClick={onResume}/>
                    </div>
                    <div style={{clear: 'both'}}/>
                </div>
            </Modal>
        )
    }
}

class ScoringModal extends React.Component {
    
    render() {
        let {onUnScoredView, onClose, ltiLaunchActive} = this.props
        return (
            <Modal isOpen className='-center' ltiLaunchActive={ltiLaunchActive} onRequestClose={onClose}>
                <h4 className='header' aria-level='2'>{'Scoring'}</h4>
                <div className='body'>
                    <div>{'These exams were not socred. Please fill out a blank answer sheet or hand score exam.'}</div>
                </div>
                <div className='footer'>
                    <div className='btn-group btn-center'>
                        <Button className='btn-default' label='Close' onClick={onClose} />
                        <Button className='btn-primary' label='View unscored exams' onClick={onUnScoredView} />
                    </div>
                    <div style={{clear: 'both'}}/>
                </div>
            </Modal>
        )
    }
}

class UnScoredExamViewModal extends React.Component {
    render() {
        let {nonFormImgs, onClose, ltiLaunchActive} = this.props
        let slides = nonFormImgs.map((slide, imgIndex) => (
            <Slide key={imgIndex} index={imgIndex}>
                <div className='carousel-item-container'>
                    <img className='img-carousel' src={slide} alt='No image' />
                </div>
            </Slide>
        ))
        return (
            <Modal isOpen className='unsored-exam-view' ltiLaunchActive={ltiLaunchActive} onRequestClose={() => {}}>
                <h4 className='header' aria-level='2'>{'Unscored exams'}</h4>
                <div className='body'>
                <CarouselProvider
                    naturalSlideWidth={100}
                    naturalSlideHeight={100}
                    totalSlides={slides.length}
                >
                    <Slider>
                        {slides}
                    </Slider>

                    <ButtonBack className='back'><i className='fa fa-angle-left fa-3x'></i></ButtonBack>
                    <ButtonNext className='next'><i className='fa fa-angle-right fa-3x'></i></ButtonNext>
                </CarouselProvider>
                </div>
                <div className='footer'>
                    <div className='btn-group pull-right'>
                        <Button className='btn-default' label='Close' onClick={onClose}/>
                    </div>
                    <div style={{clear: 'both'}}/>
                </div>
            </Modal>
        )
    }
}