const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    stringClener = string => string.replace(/(<([^>]+)>)/gi, '');

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if(author.length >= 50 || title.length >= 25) throw new Error('To many chars');
      if(fileExt === 'png' || fileExt === 'jpg' || fileExt === 'gif') {
        const newPhoto = new Photo({ 
          title: stringClener(title), 
          author: stringClener(author), 
          email: stringClener(email), 
          src: stringClener(fileName), 
          votes: 0 
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const clientIp = requestIp.getClientIp(req);
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    let voter = await Voter.findOne({ user: clientIp });

    if(!voter) {
      voter = new Voter({ 
        user: clientIp, 
        votes: [],      
      });
      await voter.save(); 
    }

    const checkIfVoted = voter.votes.includes(photoToUpdate._id); 
        
    if(checkIfVoted) {
      res.status(500).json({ message: 'Vote once' });    
    } else {
      voter.votes.push(photoToUpdate._id)
      await voter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
    }
      
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
   
  } catch(err) {
    res.status(500).json({message: err});
  }
};

