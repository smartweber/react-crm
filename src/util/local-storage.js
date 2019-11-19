const LocalStorage = {
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val))
    return this
  },
  get(key) {
    return JSON.parse(localStorage.getItem(key))
  },
  delete(key) {
    return localStorage.removeItem(key)
  },
  get size() {
    return localStorage.length
  }
}

export default LocalStorage
