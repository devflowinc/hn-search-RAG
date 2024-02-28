module.exports = {
  apps : [{
    name   : "Get Dataset",
    script : "./hn_datasets/get_dataset.py",
    interpreter: "/usr/bin/python",
    instances: 2
  },
  {
    name   : "app1",
    script : "./hn_datasets/ingest.py",
    interpreter: "/usr/bin/python",
    instances: 5
  }]
}
