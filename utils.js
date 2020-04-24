const axios = require("axios");
const qs = require("qs");

const fetchTokens = async (code, client_id, client_secret) => {
  const response = await axios({
    method: "post",
    url: "https://api.hubapi.com/oauth/v1/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    data: qs.stringify({
      grant_type: "authorization_code",
      client_id,
      client_secret,
      redirect_uri: "http://localhost:3000/redirect",
      code: code,
    }),
  });
  return response;
};

const refreshTokens = async (client_id, client_secret, refresh_token) => {
  const response = await axios({
    method: "post",
    url: "https://api.hubapi.com/oauth/v1/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    data: qs.stringify({
      grant_type: "refresh_token",
      client_id,
      client_secret,
      refresh_token,
    }),
  });
  return response;
};

const fetchContact = async (auth_token) => {
  const response = await axios({
    method: "get",
    url: "https://api.hubapi.com/contacts/v1/lists/all/contacts/all",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth_token}`,
    },
  });
  return response.data.contacts;
};

module.exports = { fetchTokens, fetchContact };
