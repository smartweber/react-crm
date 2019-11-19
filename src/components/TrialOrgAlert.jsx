import React from 'react'
import TrialAlert from './TrialAlert'

const TRIAL_MAX_STUDENTS = parseInt(process.env.TRIAL_MAX_STUDENTS)
const TRIAL_MAX_QUESTIONS = parseInt(process.env.TRIAL_MAX_QUESTIONS)

const TrialOrgAlert = () => (
  <TrialAlert actionTitle={'For larger classes or more questions'} actionLabel='Upgrade'>
    {`Welcome to your free account, you can now test up to ${TRIAL_MAX_STUDENTS} students per course`}
    {' and '}
    {`${TRIAL_MAX_QUESTIONS} questions per exam.`}
  </TrialAlert>
)
export default TrialOrgAlert
