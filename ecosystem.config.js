module.exports = {
  apps: [
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
      args: "1",
    },
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
      args: "2",
    },
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
      args: "3",
    },
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
      args: "4",
    },
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
      args: "5",
    },
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
      args: "6",
    },
    {
      name: "app1",
      script: "./hn_datasets/ingest.py",
      interpreter: "/usr/bin/python3.9",
      instances: 10,
    },
  ],
};
