Service Plugin Library:

Description:
Libs are injected into service plugin provider classes at runtime. They all Haystack to provide some common libraries like Docker, Aws.

Purpose:
We do not want each author to need to reinvent starting or stopping a container. This should be easy and hassle free.

How to use as a service plugin author:
this.haystack.libs.docker.run_container({container data here});

When creating libs as a Haystack contributor:
- The lib name is the filename converted by basename, so only underscores, no dashes or spaces please!
- The lib needs to be instantiatable. During injection it is instantiated.