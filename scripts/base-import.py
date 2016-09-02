#!/usr/bin/python

# Imports
import cobe.brain

brain = cobe.brain.Brain('zamiell.brain')

with open('zamiell-backup.txt', 'r') as f:
    for line in f:
        brain.learn(line.rstrip())

print('Import complete.')
print('Asking the bot "hello zamiel":')
print('It said:')
print(brain.reply('hello zamiel'))
