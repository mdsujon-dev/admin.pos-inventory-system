import axios from "axios";
import { url } from "../network/api";

export const getAllCompanyCategory = async () => {
  const response = await axios.get(`${url}/company-categories`);
  return response.data.data;
};

const BASE_URL = "https://bdapis.com/api/v1.2";

export const getCountries = async () => {
  const response = await axios.get(`https://restcountries.com/v3.1/all
`);
  return response.data.data;
};
export const getDivisions = async () => {
  const response = await axios.get(`${BASE_URL}/divisions`);
  return response.data.data;
};

export const getDistrictsByDivision = async (division) => {
  const response = await axios.get(`${BASE_URL}/division/${division}`);
  return response.data.data;
};
export const getUpazilasByDistrict = async (district) => {
  const response = await axios.get(`${BASE_URL}/district/${district}`);
  return response.data.data[0].upazillas;
};
