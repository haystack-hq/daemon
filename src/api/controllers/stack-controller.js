var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


Haystack = require("../../model/haystack");

/* get all stacks */
//todo: add search feature. ability to search by path
router.get('/', function (req, res) {
    //return all the stacks
    var haystacks = Haystack.Search();
    res.status(200).send(haystacks);
});


/* create a new stack */
router.post('/', function (req, res) {
    var identifier = req.body.identifier;
    var haystack = new Haystack(req.body);
    haystack.save()
    haystack.connect();
    haystack.start();

    res.status(200).send(haystack.getData());
});

/* start / stop stack */
//todo: start stack.



/* delete a stack */
router.delete('/:identifier', function (req, res) {
    var identifier = req.params.identifier;

    var haystack_data = new Haystack.FindOne(identifier)

    if(haystack_data)
    {
        var haystack = new Haystack()
        haystack.load(identifier);
        haystack.connect();
        haystack.terminate();
    }

    res.status(200).send(haystack.getData());


});


module.exports = router;
