import React from 'react'
import {Link} from 'react-router-dom'

export default function WelcomePage() {
  return (
    <main className='container welcome-page'>
      <h3>{"You're not a member of any organization yet."}</h3>
      <div className='box --student'>
        <span aria-hidden='true' className='fa-stack fa-4x'>
          <i className='fa fa-stack-2x fa-circle'/>
          <i className='fa fa-stack-1x fa-inverse fa-graduation-cap'/>
        </span>
        <h3 className='title'>{'Students'}</h3>
        <span>{'Ask your teacher for an invitation.'}</span>
      </div>
      <div className='box --teacher'>
        <span aria-hidden='true' className='fa-stack fa-4x'>
          <i className='fa fa-stack-2x fa-circle'/>
          <i className='fa fa-stack-1x fa-inverse fa-university'/>
        </span>
        <h3 className='title'>{'Teachers'}</h3>
        <span>{'Ask your administrator for an invite, or '}</span><br/>
        <Link to='/settings/orgs/new'>{'create a new organization.'}</Link>
      </div>
    </main>
  )
}
