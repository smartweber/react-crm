import React from 'react'

/**
 * @Editable Text
 */
export default class EditableText extends React.PureComponent {
  constructor(props) {
    super(props)
    this.editInputRef

    this.state = {
      isEdit: false
    }

    this.editUp = () => {
      this.setState({isEdit: true})
    }

    this.editDown = () => {
      this.setState({isEdit: false})
    }
  }

  componentDidUpdate() {
    if (this.state.isEdit && this.editInputRef) {
      this.editInputRef.focus()
    }
  }

  render() {
    const {className, value, answer, index, targetValue, onChangeAnswerPartialWeight, ariaLabel} = this.props
    const {isEdit} = this.state

    if (!value) {
      return (
        <div
          className={className}
          onBlur={this.editDown}
          onClick={this.editUp}>
          {!isEdit &&
            <span>-</span>
          }
          {isEdit &&
            <input
              type='number'
              value={value}
              aria-label={ariaLabel}
              ref={(editInputRef) => { this.editInputRef = editInputRef; }} 
              onChange={(event) => onChangeAnswerPartialWeight(event, answer, index, targetValue)}/>
          }
        </div>
      )
    }

    return (
      <div className={className}>
        <input
          type='number'
          value={value}
          aria-label={ariaLabel}
          onChange={(event) => onChangeAnswerPartialWeight(event, answer, index, targetValue)}/>
      </div>
    )
  }
}