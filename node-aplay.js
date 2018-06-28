/**
 * Javascript ALSA aplay wrapper for Node.js
 *
 * @mantainedBy Rocco Musolino - @roccomuso
 * @author Patrik Melander (lotAballs) node-aplay module
 * @originalAuthor Maciej Sopyło @ KILLAHFORGE.
 *
 * Dependencies: sudo apt-get install alsa-base alsa-utils
 * MIT License
 */

var os = require('os')
var spawn = require('child_process').spawn
var events = require('events')
var util = require('util')

var aplayExec = os.platform() === 'darwin' ? 'afplay' : 'aplay'

function Sound (opts) {
  events.EventEmitter.call(this)
  opts = opts || {}
  this.channel = opts.channel || null
  this.device = opts.device || null
}

util.inherits(Sound, events.EventEmitter)

Sound.prototype.play = function (fileName) {
  this.stopped = false
  if (typeof this.process !== 'undefined') this.process.kill('SIGTERM') // avoid multiple play for the same istance
  var args = []
  if (this.channel) args = args.concat(['-c ' + this.channel])
  if (this.device) args = args.concat(['-D ' + this.device])
  args = args.concat([fileName])
  console.log('play args:', aplayExec, JSON.stringify(args));
  this.process = spawn(aplayExec, args)
  var self = this

  this.process.on('exit', function (code, sig) {
    console.log(`child process exited with code ${code} and signal ${sig}`);
    self.stopped = true
    if (code !== null && sig === null) {
      self.emit('complete')
    }
  })
  this.process.on('error', function (error) {
    console.log(`child process error: ${error}`);
  })
  
  this.process.stdout.on('data', (data) => {
    console.log(`child process stdout:\n${data}`);
  });
  this.process..stderr.on('data', (data) => {
    console.error(`child process stderr:\n${data}`);
  });
  
  return this
}
Sound.prototype.stop = function () {
  if (this.process) {
    this.stopped = true
    this.process.kill('SIGTERM')
    this.emit('stop')
  }
  return this
}
Sound.prototype.pause = function () {
  if (this.process) {
    if (this.stopped) return true
    this.process.kill('SIGSTOP')
    this.emit('pause')
  }
  return this
}
Sound.prototype.resume = function () {
  if (this.process) {
    if (this.stopped) return this.play()
    this.process.kill('SIGCONT')
    this.emit('resume')
  }
  return this
}
Sound.prototype.channel = function (ch) {
  this.channel = ch
  return this
}
Sound.prototype.device = function (d) {
  this.device = d
  return this
}

module.exports = Sound

// autonomous execution: node node-aplay.js my-song.wav
if (!module.parent) {
  var player = new Sound()
  player.play(process.argv[2])
}
