

#Create / Run a New Stack

POST

http://127.0.0.1:3000/stacks

Content-Type:
application/json


Body:
```{
"provider": "local",
"identifier": "the-unique-stack-identifer",
"stack_file_location": "/absolute/path/to/the/stack/file/on/the/machine."
}
```

Note: you can find a basic stack file in resources/simple-haystack-file/Haystack.json



#Config
####stacks.terminated_remove_after
Duration in seconds that the stacks will be removed after they have been terminated. Min value 0.


