const PX_ORIGIN = process.env.PX_ORIGIN

const send = PX_ORIGIN
  ? function sendPx(type, fields) {
    let safe64 = btoa(JSON.stringify({type, fields}))
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/=+$/, '')
    new Image().src = `${PX_ORIGIN}?b=${safe64}&t=${Date.now()}`
  }
  : Function.prototype

export default send
