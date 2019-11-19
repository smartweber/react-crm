import React from 'react'
import {Link} from 'react-router-dom'
import {Info} from './misc'
import {formatTimeRange} from './DayPicker'

export default class CourseList extends React.Component {
  static propTypes = {
    // onLoad: PropTypes.func.isRequired,
    // onLoadAuthStatus: PropTypes.func.isRequired,
    // orgId: PropTypes.string.isRequired,
  }
  constructor(props) {
    super(props)
    this.state = {loading: null, err: null, courses: null}
  }
  componentDidMount() {
    this.loadItems()
  }
  componentDidUpdate(prevProps) {
    // eslint-disable-next-line eqeqeq
    if (this.props.orgId != prevProps.orgId) {
      this.loadItems()
    }
  }
  componentWillUnmount() {
    if (this.state.loading) this.state.loading.cancel()
  }
  loadItems() {
    if (this.state.loading) this.state.loading.cancel()
    let loading = this.props.onLoad().then(res => {
      this.setState({
        loading: null,
        err: null,
        orgId: res.orgId,
        courses: res.courses
      })
    }).catch(err => {
      this._pending = null
      if (err.statusCode === 401) {
        this.props.onLoadAuthStatus()
        return null
      }
      this.setState({loading: null, err})
    })
    this.setState({loading})
  }
  renderListItem(course, index, orgId) {
    return (
      <div className='listitem' key={index}>
        <Link to={`/view/${orgId}/${course.id}`}>{course.shortName + ' ' + course.name}</Link>
        <small>{course.term + ' ' + course.year}</small>
        <small>{formatTimeRange(course.days, course.timeStart, course.timeEnd)}</small>
        <br/>
        <small>{'ID ' + course.id}</small>
      </div>
    )
  }
  render() {
    let {err, loading, courses, orgId} = this.state
    if (loading) return (
      <div className='course-list'>
        <h5>{'My Courses '}<i aria-hidden='true' className='fa fa-lg fa-spin fa-spinner'/></h5>
        <div className='list'>
          <div className='listitem'>
            <span className='sr-only'>{'loading'}</span>
          </div>
        </div>
      </div>
    )
    if (err) return (
      <div className='course-list'>
        <Info>{err.message}</Info>
      </div>
    )
    if (!courses || courses.length < 1) return (
      <div className='course-list'>
        <h5>{'No relevant courses found'}</h5>
        <div className='list'>
          <div className='listitem'>
            <p>{"If you're added to a class roster, or are allowed to create a class, it will be listed here."}</p>
          </div>
        </div>
      </div>
    )
    return (
      <div className='course-list'>
        <h5>{'My Courses'}</h5>
        <div className='list'>
          {courses.map((row, index) => this.renderListItem(row, index, orgId))}
        </div>
      </div>
    )
  }
}
