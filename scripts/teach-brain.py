#!/usr/bin/python

# Imports
import sys
import os
import cobe.brain

# Configuration
brain_directory = '/root/angelica/brains'

# Validate command line arguments
if len(sys.argv) != 3:  # 2 command line arguments
    print('usage: [brain-name] [line-to-teach]')
    sys.exit(1)

# Open the brain
brain_location = os.path.join(brain_directory, sys.argv[1] + '.brain')
brain = cobe.brain.Brain(brain_location)
print('Opened brain: ' + brain_location)

# Teach the line
brain.learn(sys.argv[2])
print('Taught line: ' + sys.argv[2])
