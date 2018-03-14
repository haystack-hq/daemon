var Haystack = require("./model/haystack");
var app = require('./agent');

// server.js
var port = process.env.PORT || 3000;
var server = app.listen(port, function() {
    console.log('Haystack Client Agent listening on port ' + port);
});



//load app
var haystacks = Haystack.Search();
haystacks.forEach(function (haystack_data) {
    var haystack = new Haystack(haystack_data);
});



