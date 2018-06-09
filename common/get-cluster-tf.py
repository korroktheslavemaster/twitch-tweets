import tensorflow as tf
import tensorflow_hub as hub
import matplotlib.pyplot as plt
import numpy as np
import os
import pandas as pd
import re
import seaborn as sns
import json
from pprint import pprint
import sys
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.cluster import AffinityPropagation

module_url = "https://tfhub.dev/google/universal-sentence-encoder/2" #@param ["https://tfhub.dev/google/universal-sentence-encoder/1", "https://tfhub.dev/google/universal-sentence-encoder-large/1"]
# Import the Universal Sentence Encoder's TF Hub module
embed = hub.Module(module_url)
tf.logging.set_verbosity(tf.logging.ERROR)

# Disable
def blockPrint():
  sys.stdout = open(os.devnull, 'w')

# Restore
def enablePrint():
  sys.stdout = sys.__stdout__


def getEmbeddings(messages):
  with tf.Session(config=tf.ConfigProto(log_device_placement=True)) as session:
    session.run([tf.global_variables_initializer(), tf.tables_initializer()])
    message_embeddings = session.run(embed(messages))
    return np.array(message_embeddings)


with open(sys.argv[1]) as f:
  data = json.load(f)
data = sorted(data, key=lambda x: -x['count'])

if len(data) == 0:
  print([])
  sys.exit(0)

messages, counts, ids, channels = zip(*[(d['message'], d['count'], d['_id'], d['channel']) for d in data])


blockPrint()
embeddings = getEmbeddings(messages)
enablePrint()

n_clusters = int(len(messages)*0.8)
kmeans = KMeans(n_clusters=n_clusters).fit(embeddings)

labels = kmeans.labels_
centerDistances = kmeans.transform(embeddings).transpose()
finalDict = [[] for _ in range(n_clusters)]
finalIds = [[] for _ in range(n_clusters)]
finalCounts = [0] * n_clusters
finalCanonicalStrings = []
finalChannels = []
finalCanonicalIds = []
# print finalDict
for i, label in enumerate(labels):
#     print i, label
  finalDict[label].append(messages[i])
  finalIds[label].append(ids[i])
  finalCounts[label] += counts[i]
for i in range(n_clusters):
  canonicalIdx = np.argmin(centerDistances[i])
  finalCanonicalStrings.append(messages[canonicalIdx])
  finalCanonicalIds.append(ids[canonicalIdx])
  finalChannels.append(channels[canonicalIdx])
countsAndMessages = zip(finalCounts, finalIds, finalCanonicalStrings, finalChannels, finalCanonicalIds)
countsAndMessages = sorted(countsAndMessages, key=lambda x: -x[0])
finalJson = [{'count': count, 'ids': ids, 'canonicalMessage': canonicalMessage, 'channel': channel, 'canonicalId': canonicalId } for count, ids, canonicalMessage, channel, canonicalId in countsAndMessages]

with open(sys.argv[2], 'w') as outfile:
  json.dump(finalJson, outfile)
# pprint(finalJson[0])