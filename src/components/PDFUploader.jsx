import React from 'react'
import api from '../api'
import Promise from '../util/promise'

const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES)

const UPLOAD_PENDING = (
  <div className='progress'>
    <div style={{width: '100%'}} className='progress-bar progress-bar-info progress-bar-striped active'/>
  </div>
)
const UPLOAD_SUCCESS = (
  <div className='ok'>
    {'Upload received'}
  </div>
)
const UPLOAD_INFO = (
  <div className='alert alert-info text-center'>
    {' Check the upload status table to monitor the progress of the uploaded file(s). '}
  </div>
)
const renderError = (message) => {
  return (
    <div className='fail'>
      <i aria-hidden='true' className='fa fa-lg fa-exclamation-triangle'/>
      <span>{' ' + message}</span>
    </div>
  )
}
const Files = ({scanStation, orgRole, files}) => {
  let hadSuccess = files.filter(file => !file.err).length > 0
  return (
    <div className='upload-results'>
      <div className='files'>
        {files.map((file, index) => (
          <div className='file' key={index}>
            <div className='name' title={file.name}>{file.name}</div>
            <div className='size'>{file.sizeHuman}</div>
            <div className='status' role="alert" aria-live="assertive">
              {file.err
                ? renderError(file.err.message)
                : file.loading ? UPLOAD_PENDING : UPLOAD_SUCCESS}
            </div>
          </div>
        ))}
      </div>
      {(hadSuccess && (scanStation && (['admin', 'teacher', 'assistant'].indexOf(orgRole) >= 0) || !scanStation)) && UPLOAD_INFO}
    </div>
  )
}
const filter = (file) => {
  file.loading = true
  if (!/\.pdf$/i.test(file.name)) {
    file.err = new Error('invalid file type')
    return false
  }
  if (file.size >= MAX_UPLOAD_BYTES) {
    file.err = new Error('file is too big')
    return false
  }
  return true
}
const upload = ({orgId, courseId, examId, prevPending, prevFiles, files, element}) => {
  let validFiles = files.filter(filter)
  let pending
  let run = () => Promise.mapSeries(validFiles, blob => {
    // Send each file, one at a time, but don't stop if one fails
    return api.exams.uploadResponses({orgId, courseId, examId, blob})
    .then(() => {
      blob.loading = false
      element.forceUpdate()
      return true
    })
    .catch(err => {
      blob.loading = false
      blob.err = err
      element.forceUpdate()
      return false
    })
  })
  pending = prevPending ? prevPending.then(run) : run()
  if (prevFiles) {
    files = prevFiles.concat(files)
  }
  return [files, pending]
}

export default {Files, upload}
