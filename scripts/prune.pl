#!/usr/bin/perl

use strict;
use warnings;

my $lineNum = 1;
for my $line (`cat zamiel.txt`) {
	# Wed Mar 02 2016 10:25:46 GMT-0500 (EST) - TWITCH [#zamiell] <zamiell> !racelist
	#if ($line =~ /^\w+ \w+ \d\d \d\d\d\d \d\d:\d\d:\d\d GMT-0\d00 (EST) - TWITCH [#zamiell] <.+?> (.+)/) {
	if ($line =~ /^\w+ \w+ \d\d \d\d\d\d \d\d:\d\d:\d\d GMT-0\d00 \(.+?\) - TWITCH \[#zamiell\] <.+?> (.+)/) {
		print "$1\n";
	} else {
		print "Error parsing on line $lineNum: $line\n";
		exit;
	}

	$lineNum++;
}
