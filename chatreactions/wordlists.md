# word lists

## default

by default nypsi will use the english_1k word list from [monkeytype](https://monkeytype.com).

nypsi also comes with english_5k and english_10k from monkeytype, which you can easily change to

## changing word list type

to change the word list type, you can use the command below. if the word list is set to custom, but
the word list is empty, it will revert back to using english_1k

_if you want to use a custom word list, the type must be set to 'custom'_

```
$cr words type
```

## adding to word list

to add to the server's custom word list, use the below command

```
$cr words add <word>
```

## removing from word list

to remove from the server's custom word list, use the below command

```
$cr words del <word>
```

## viewing the word list

to view the current word list, use the command below

```
$cr words list
```

## resetting the word list

if you'd like to delete everything from your custom word list, use the command below

```
$cr words reset
```
