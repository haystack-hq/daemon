
var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var fs = require("fs-extra");
var StackController = require("../../model/stack/controller");



/* get all stacks */
//todo: add search feature. ability to search by path
router.get('/', function (req, res) {
    //return all the stacks
    var stacks = req.stack_manager.search();
    res.status(200).send(stacks);
});



router.post('/search', function (req, res) {

    try
    {
        var params = req.body;

        if(params.stack_file_location)
        {
            //find the stack file,
            params.stack_file_location = StackManager.FindStackFilePath(params.stack_file_location)
        }

        var stacks = req.stack_manager.search(params);
        res.status(200).send(stacks);
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
        var stack = req.stack_manager.load(identifier);

        res.status(200).send(stack);
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
        var provider = params.provider;
        var mode = params.mode;

        var stack = req.stack_manager.load_from_path(path, null, provider, mode);

        console.log(stack);

        var stack_controller = new StackController(stack);
        stack_controller.start().then((result) => {}).catch((err) => {});

        res.status(200).send(stack.getData());

    }
    catch (ex){
        res.status(401).send(ex.message);
    }





});

/* restart / stop stack */
//todo: start stack.



/* delete a stack */
router.delete('/:identifier', function (req, res) {
    var identifier = req.params.identifier;

    try
    {
        var stack = req.stack_manager.load(identifier);
        var stack_controller = new StackController(stack);

        stack_controller.terminate();

        res.status(200).send(stack.getData());
    }
    catch (ex){
        res.status(401).send(ex);
    }



});






module.exports = router;
