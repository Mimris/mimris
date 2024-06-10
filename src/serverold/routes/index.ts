/// @ts-nocheck
import express from 'express'
const router = express.Router()
// const Photos = require('../models/photoModel')

router.get('/', (req, res) => {
  console.log('7', 'aaaaa');
  res.send('dettet er det')
  // Photos.find({}, (err, photos) => {
  //   res.json(photos)
  // })
})
router.use('/:id', (req, res, next) => {
  console.log(req.params.id)
  console.log('7', 'bbb');
  res.send('dettet er det')
  // Photos.findById(req.params.id, (err, photo) => {
  //   if (err)
  //     res.status(500).send(err)
  //   else
  //     req.photo = photo
  //   next()
  // })
})
router
  .get('/:id', (req, res) => {
    return res.json(req.photo)
  })
  .put('/:id', (req, res) => {
    if (debug) console.log('7', 'ccc');
    res.send('dettet er det')
    // Object.keys(req.body).map(key => {
      // req.photo[key] = req.body[key]
    // })
    // req.photo.save()
    // res.json(req.photo)
  })
module.exports = router;