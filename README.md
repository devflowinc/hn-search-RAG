<p align="center">
  <img height="100" src="https://cdn.trieve.ai/trieve-logo-copy.png" alt="Trieve Logo">
</p>
<p align="center">
<strong><a href="https://dashboard.trieve.ai">Sign Up (1k chunks free)</a> | <a href="https://hn.trieve.ai">HN Search and RAG</a> |<a href="https://docs.trieve.ai">Documentation</a> | <a href="https://cal.com/nick.k/meet">Meeting Link</a> | <a href="https://discord.gg/eBJXXZDB8z">Discord</a> | <a href="https://matrix.to/#/#trieve-general:trieve.ai">Matrix</a>
</strong>
</p>

<p align="center">
    <a href="https://github.com/devflowinc/trieve/stargazers">
        <img src="https://img.shields.io/github/stars/devflowinc/trieve.svg?style=flat&color=yellow" alt="Github stars"/>
    </a>
    <a href="https://github.com/devflowinc/trieve/issues">
        <img src="https://img.shields.io/github/issues/devflowinc/trieve.svg?style=flat&color=success" alt="GitHub issues"/>
    </a>
    <a href="https://discord.gg/CuJVfgZf54">
        <img src="https://img.shields.io/discord/1130153053056684123.svg?label=Discord&logo=Discord&colorB=7289da&style=flat" alt="Join Discord"/>
    </a>
    <a href="https://matrix.to/#/#trieve-general:trieve.ai">
        <img src="https://img.shields.io/badge/matrix-join-purple?style=flat&logo=matrix&logocolor=white" alt="Join Matrix"/>
    </a>
</p>

<h2 align="center">
    <b>Trieve HN Discovery is Home to All Code for Hacker News Search and RAG</b>
</h2>

![Trieve OG tag](https://cdn.trieve.ai/blog/trieve-hn-discovery/trieve-hn-discovery-preview-opengraph.webp)

## About

This repository contains the code for an engine which provides sub-100ms vector search (SPLADE, dense vector,  cross-encoder re-rank'ed hybrid), recommendations, RAG, and analytics for Hacker News. 

## Quick Links

- [Launching Trieve HN Discovery - A Discovery Focused Search Engine for Hacker News](https://trieve.ai/launching-trieve-hn-discovery/)

## Contributing 

Issues and contributions are welcome! There are three main folders for this project and they contain the code for their respective components of the application. 

- `actix-frontend` for the nojs version at [hnnojs.trieve.ai](https://hnnojs.trieve.ai) built using Rust actix-web and Minijinja 
- `solidjs-spa` for the power tool JS version at [hn.trieve.ai](https://hn.trieve.ai)
- `ingest` for the various scripts relying on Redis queue's for pulling all of the data from the API and indexing it into a Trieve instance for search and RAG

## Why Make This?

1. Dense vector semantic search, re-rankers, SPLADE, and other techniques have gotten a lot of hype recently, but it's hard to figure out where each technique is best applied. We're hackers and built hacker'y features into Trieve to make it easier to test and experiment with this new tech, and needed a dataset us and our friends would have knowledge of to mess with. We're hoping to build lots of cool shareable projects on top of this demo to learn and collect feedback with.

2. Make HN search more explorable with recommendations plus RAG and more open with public analytics. We added a feedback button under the search bar and are collecting CTR data such that we can continously fine-tune our models to improve the search experience. If you have some time, try out our blind comparison at hn-comparison.trieve.ai to help us collect higher quality training data.

3. Open up a more fully-featured discovery API for others who want to build on top of HN data. The firebase HN API is great, but storing all the data yourself is expensive and time-consuming. We are hoping to lower that barrier in the old Octopart HNSearch spirit.

4. Show what's possible with Trieve, work out scaling/stability bugs, and pressure test.

5. HN is a cool place where we like to spend time and showing what we are working on to this community we feel apart is something we're excited about!