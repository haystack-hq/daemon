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


router.get('/:identifier', function (req, res) {
    //return just the one stack
    try
    {
        var identifier = req.params.identifier;
        var haystack = new Haystack().load(identifier);

        res.status(200).send(haystack);
    }
    catch (ex) {
        res.status(401).send(ex);
    }


});


/* create a new stack */
router.post('/', function (req, res) {
    var identifier = req.body.identifier;


    //check to see if this stack exists.
    var results = Haystack.Search({identifier: identifier});


    //remove and terminated statuses
    results.forEach(function (hs) {
        var stack = new Haystack().load(identifier);
        if(stack.status == Haystack.Statuses.terminated){
            stack.delete();
        }
    });

    //check again to see if we can proceed.
    var results = Haystack.Search({identifier: identifier});

    if(results.length == 0)
    {
        var haystack = new Haystack(req.body);
        haystack.save()
        haystack.connect();
        haystack.start();

        res.status(200).send(haystack.getData());
    }
    else
    {
        res.status(401).send("There is already a stack with the id '" + identifier + "'.");
    }


});

/* restart / stop stack */
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
