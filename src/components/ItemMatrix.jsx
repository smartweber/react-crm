import React from 'react'
import PropTypes from 'prop-types'
import Select from './Select'

export default class ItemMatrix extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {selectedKeyIndex: 0}
    this.getLabel = key => `Answer Key "${key.id}"`
    this.change = (key, index) => {
      this.setState({selectedKeyIndex: index})
      this.props.onChangeSelectedKeyIndex(index)  
    }
    props.onChangeSelectedKeyIndex(this.state.selectedKeyIndex)
  }
  render() {
    let answerKeys = this.props.data
    let {selectedKeyIndex} = this.state
    let questions = answerKeys[selectedKeyIndex].questions
    let matrix = [
      [[], [], []],
      [[], [], []],
      [[], [], []]
    ]
    for (let index = 0; index < questions.length; index++) {
      let question = questions[index]
      let row = question.rpb < 0.150 ? 0
        : question.rpb < 0.3 ? 1
        : 2
      let col = question.difficultyIndex < 0.5 ? 0
        : question.difficultyIndex < 0.85 ? 1
        : 2
      matrix[row][col].push(index + 1)
    }
    return (
      <div>
        <Select
          opt={answerKeys}
          ariaLabel='Answer Keys'
          value={answerKeys[selectedKeyIndex]}
          labeler={this.getLabel}
          onChange={this.change}
        />
        <div className='table-responsive'>
          <table className='table table-bordered' style={{marginTop: '10px'}} summary='Item matrix table'>
            <tbody>
              <tr style={{whiteSpace: 'nowrap'}}>
                <th>
                  <div><i className='fa fa-long-arrow-right'/>{' Difficulty'}</div>
                  <div><i className='fa fa-long-arrow-down'/>{' Discrimination'}</div>
                </th>
                <th>{'Hard (0 - 0.49)'}</th>
                <th>{'Medium (0.5 - 0.84)'}</th>
                <th>{'Easy (0.85 - 1.0)'}</th>
              </tr>
              <tr>
                <th>{'Poor (< 0.15)'}</th>
                <td>
                  {matrix[0][0].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of Hard (0 - 0.49) Difficulty and Poor (< 0.15) Discrimination is ${matrix[0][0].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[0][0].join(', ')}
                  </a>}
                </td>
                <td>
                  {matrix[0][1].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Medium (0.5 - 0.84) Difficulty and Poor (< 0.15) Discrimination is ${matrix[0][1].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[0][1].join(', ')}
                  </a>}
                </td>
                <td>
                  {matrix[0][2].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Easy (0.85 - 1.0) Difficulty and Poor (< 0.15) Discrimination is ${matrix[0][2].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[0][2].join(', ')}
                  </a>}
                </td>
              </tr>
              <tr>
                <th>{'Fair (0.15 - 0.3)'}</th>
                <td>
                  {matrix[1][0].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Hard (0 - 0.49) Difficulty and Fair (0.15 - 0.3) Discrimination is ${matrix[1][0].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[1][0].join(', ')}
                  </a>}
                </td>
                <td>
                  {matrix[1][1].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Medium (0.5 - 0.84) Difficulty and Fair (0.15 - 0.3) Discrimination is ${matrix[1][1].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[1][1].join(', ')}
                  </a>}
                </td>
                <td>
                  {matrix[1][2].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Easy (0.85 - 1.0) Difficulty and Fair (0.15 - 0.3) Discrimination is ${matrix[1][2].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[1][2].join(', ')}
                  </a>}
                </td>
              </tr>
              <tr>
                <th>{'Good (0.3 - 1)'}</th>
                <td>
                  {matrix[2][0].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Hard (0 - 0.49) Difficulty and Good (0.3 - 1) Discrimination is ${matrix[2][0].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[2][0].join(', ')}
                  </a>}
                </td>
                <td>
                  {matrix[2][1].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Medium (0.5 - 0.84) Difficulty and Good (0.3 - 1) Discrimination is ${matrix[2][1].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[2][1].join(', ')}
                  </a>}
                </td>
                <td>
                  {matrix[2][2].join(', ') && <a href='javascript:void(0)' className='text' aria-label={`Value of 'Easy (0.85 - 1.0) Difficulty and Good (0.3 - 1) Discrimination is ${matrix[2][2].join(', ')}`} role='Presentation' tabIndex='-1'>
                    {matrix[2][2].join(', ')}
                  </a>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

ItemMatrix.propTypes = {
  data: PropTypes.array,
  onChangeSelectedKeyIndex: PropTypes.func.isRequired,
}
