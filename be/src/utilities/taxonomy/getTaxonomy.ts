import axios from "axios";
import vars from "../../vars";
import yaml from "js-yaml";

const getTaxonomy = async()=>{
    const response = await axios.get(vars.yaml_url);
    const yamlText = response.data;
    const data = yaml.load(yamlText) as Array<any>;

    const responses = data[0];
    const situations = data[1];

    return {responses, situations};
}
export default getTaxonomy;
