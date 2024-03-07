module.exports = {
  apps: [
    {
      name: "Populate Redis",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 1,
    },
    {
      name: "Get Dataset",
      script: "./hn_datasets/get_dataset.py",
      interpreter: "/usr/bin/python3.9",
      instances: 20,
    },
  ],
};
