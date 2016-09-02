#!/usr/bin/python

# Imports
import sys
import os
import cobe.brain

# Configuration
brain_directory = '/root/angelica/brains'

# Validate command line arguments
if len(sys.argv) != 3:  # 2 command line arguments
    print('usage: [brain-name] [line-to-use-for-response]')
    sys.exit(1)

# Open the brain
brain_location = os.path.join(brain_directory, sys.argv[1] + '.brain')
print(brain_location)
brain = cobe.brain.Brain(brain_location)
print('Opened brain: ' + brain_location)

# Get the response
response = brain.reply(sys.argv[2])
print('Using input of: ' + sys.argv[2])
print('Got response of: ' + response)

# Write the response to a file
with open(os.path.join(brain_directory, sys.argv[1] + '-response.txt'), 'w+') as f:
    f.write(response)
