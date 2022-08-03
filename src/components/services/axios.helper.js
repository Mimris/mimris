import axios from 'axios';

const cancelConfig = {
  request: null,
  cancelToken: null
};

async function axiosGetCancellable(url, config) {
  if (cancelConfig.request) {
    cancelConfig.request.cancel('canceled');
  }

  cancelConfig.request = axios.CancelToken.source();
  cancelConfig.cancelToken = cancelConfig.request.token;
  Object.assign(cancelConfig, config);

  try {
    const res = await axios.get(url, cancelConfig);
    console.log('19 axiosGetCancellable: res:', res);
    return res;
  } catch (error) {
    console.log('22 axiosGetCancellable: error:', error);
    // if (error.message !== 'canceled') {
    if (error.message) {
      throw error;
    }
  }
}

export { axiosGetCancellable };
