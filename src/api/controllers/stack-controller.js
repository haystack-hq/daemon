
var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var fs = require("fs-extra");
var HaystackManager = require("../../model/haystack/haystack-manager");



/* get all stacks */
//todo: add search feature. ability to search by path
router.get('/', function (req, res) {
    //return all the stacks
    var haystacks = req.haystack_manager.search();
    res.status(200).send(haystacks);
});



router.post('/search', function (req, res) {

    try
    {
        var params = req.body;

        if(params.stack_file_location)
        {
            //find the haystack file,
            params.stack_file_location = HaystackManager.FindHaystackFilePath(params.stack_file_location)
        }

        var haystacks = req.haystack_manager.search(params);
        res.status(200).send(haystacks);
    }
    catch (ex) {
        res.status(401).send(ex);
    }

});


router.get('/:identifier', function (req, res) {
    //return just the one stack
    try
    {
        var identifier = req.params.identifier;
        var haystack = req.haystack_manager.load(identifier);

        res.status(200).send(haystack);
    }
    catch (ex) {
        res.status(401).send(ex);
    }


});


/* create a new stack */
router.post('/', function (req, res) {
    var identifier = null;


    console.log("new stack");

    try {
        var params = req.body;
        var path = params.stack_file_location;


        var haystack = req.haystack_manager.create_from_path(path, params);
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
        var haystack = req.haystack_manager.load(identifier);

        console.log(haystack);

        haystack.terminate();
        res.status(200).send(haystack.getData());
    }
    catch (ex){
        res.status(401).send(ex);
    }



});






module.exports = router;
