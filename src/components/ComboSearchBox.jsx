'use strict'
import React from 'react'
import Select from './Select'
import SearchBox from './SearchBox'

export default (props) => (
  <div className='combo-box'>
    <Select
      disabled={props.loading}
      labeler={props.labeler}
      nullable={props.placeholder}
      onChange={props.onChange}
      opt={props.opt}
      value={props.value}
    />
    <SearchBox
      disabled={!props.value}
      loading={props.loading}
      onSubmit={props.onSubmit}
    />
  </div>
)
