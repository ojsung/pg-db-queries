This module uses pg as the client between postgres and the typescript project.

It is designed for nodejs v12.


Please be aware, because this module will allow for a dynamic number of columns and values, it will need to do some preprocessing that a query with hardcoded column names and number of values wouldn't.  I made this because I recognize that there are many cases where those things can change, and we don't always know.

The reason it is slower is because it uses string concatenation, which is one of the slower processes for any language...  Node js (as of v12) performs string concatenation with the += operation faster than by any other means.  As well, string interpolation using the back-tick symbol is faster than multiple string concatenations.  So I have used that wherever possible.  The performance is still very good, but still slower than hardcoding the names of your columns and the number of values.

As a side-note: any method with the word "create" in the name (usually found in db-query-interpreter.ts) could probably be optimized in future version of node.  I truly hate using loops to create concatenated strings, but I don't have much choice here.

The exported queries are insert, select, selectById, and update.

Insert can also be used as upsert by passing the upsert parameter to it.  The details are documented in the module itself.

The class you will need to import is DbManager from db-manager.ts

I'm sorry for not packaging this as a node module.  I am always running between too many things to do. Just... copy-paste I guess.


TO START:

1. Edit the dbconfig.ts with your db info.
2. Change lines 18 and 19 in db-manager.ts to your favorite error handler.  Right now, it's just logging to the console.
3. Copy-paste this whole folder into your node project.
