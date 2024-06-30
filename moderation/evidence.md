# evidence

evidence is a system that allows moderators to upload evidence to a nypsi moderation case

## whats the point?

instead of uploading your evidence to discord in a channel, this will ensure that your evidence is
never deleted, unless you delete it. it is also directly attached to the case, accessible by
clicking a button after using the `$case` command, which means less context switching if you keep
your evidence in a specific channel

## how is it stored?

evidence is stored in an S3 bucket with a long and randomized name, making attempting to look for
this evidence by url scraping almost impossible. it would take years to find an image due to the
immense amount of different possible combinations

## how do i add evidence to a case

when you do the `$case` command, there will be an evidence button to either view evidence, or to add
evidence.

## how do i get more storage?

to get more storage you can contact `@m.axz` on discord.
