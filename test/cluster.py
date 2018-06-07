import json
from pprint import pprint
import numpy as np

with open('/tmp/messagecount-recent.json') as f:
  data = json.load(f)

""" more orthodox and robust implementation """
def dice_coefficient(a, b):
  """dice coefficient 2nt/na + nb."""
  if not len(a) or not len(b): return 0.0
  if len(a) == 1:  a=a+u'.'
  if len(b) == 1:  b=b+u'.'
  
  a_bigram_list=[]
  for i in range(len(a)-1):
    a_bigram_list.append(a[i:i+2])
  b_bigram_list=[]
  for i in range(len(b)-1):
    b_bigram_list.append(b[i:i+2])
    
  a_bigrams = set(a_bigram_list)
  b_bigrams = set(b_bigram_list)
  overlap = len(a_bigrams & b_bigrams)
  dice_coeff = overlap * 2.0/(len(a_bigrams) + len(b_bigrams))
  return dice_coeff

data = sorted(data, key=lambda x: -x['count'])
graph = [ dice_coefficient(a['message'], b['message']) for a in data for b in data]
print(graph)
# print([d['message'] for d in data])
