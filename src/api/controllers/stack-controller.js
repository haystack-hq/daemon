var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var fs = require("fs-extra");







Haystack = require("../../model/haystack");

/* get all stacks */
//todo: add search feature. ability to search by path
router.get('/', function (req, res) {
    //return all the stacks
    var haystacks = Haystack.Search();
    res.status(200).send(haystacks);
});


router.get('/', function (req, res) {
    //return all the stacks
    var haystacks = Haystack.Search();
    res.status(200).send(haystacks);
});


router.post('/search', function (req, res) {

    var params = req.body;

    if(params.stack_file_location)
    {
        //find the haystack file,
        params.stack_file_location = Haystack.FindHaystackFilePath(params.stack_file_location)
    }


    var haystacks = Haystack.Search(params);
    res.status(200).send(haystacks);
});


router.get('/:identifier', function (req, res) {
    //return just the one stack
    try
    {
        var identifier = req.params.identifier;
        var haystack = new Haystack(req.event_bus).load(identifier);

        res.status(200).send(haystack);
    }
    catch (ex) {
        res.status(401).send(ex);
    }


});


/* create a new stack */
router.post('/', function (req, res) {
    var identifier = null;


    try {
        var params = req.body;



        //validate that the haystack file exists
        if(!fs.pathExistsSync(params.stack_file_location)){
            throw ("Haystackfile does not exists at '" + params.stack_file_location + "'.");
        }

        if(!params.identifier){
            //generate an identifier.
            params.identifier = Haystack.GenerateIdentifierFromPath(params.stack_file_location);
        }


        //check to see if this stack exists.
        var results = Haystack.Search({identifier: params.identifier});


        //remove and terminated cat be deleted.
        results.forEach(function (hs) {
            var stack = new Haystack(req.event_bus).load(params.identifier);
            if(stack.status == Haystack.Statuses.terminated){
                stack.delete();
            }
        });

        //check again to see if we can proceed.
        var results = Haystack.Search({identifier: params.identifier});
        if(results.length > 0){
            throw ("Cannot create stack. There is already a stack with the id '" + params.identifier + "'.");
        }


        //check to see if there is a stack with the path provided.
        var results = Haystack.Search({stack_file_location: params.stack_file_location});
        if(results.length > 0){
            throw ("Cannot create stack. There is already a stack at path '" + params.stack_file_location + "'.");
        }


        //create the new stack
        var haystack = new Haystack(req.event_bus, req.body);
        haystack.save();
        haystack.connect();
        haystack.start();

        res.status(200).send(haystack.getData());



    }
    catch (ex){
        res.status(401).send(ex);
    }










});

/* restart / stop stack */
//todo: start stack.



/* delete a stack */
router.delete('/:identifier', function (req, res) {
    var identifier = req.params.identifier;

    try
    {
        var haystack = new Haystack(req.event_bus).load(identifier);

        haystack.connect();
        haystack.terminate();


        res.status(200).send(haystack.getData());
    }
    catch (ex){
        res.status(401).send(ex);
    }



});


/* ssh cmd for service */
router.post('/:identifier/ssh', function (req, res) {
    var identifier = req.params.identifier;
    var service = req.body.service;

    res.status(200).send({
        cmd: 'docker exec -it ' + identifier + '_' + service + ' /bin/sh'
    })
});



module.exports = router;
