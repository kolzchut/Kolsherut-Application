import vars from "../../../../vars";

export default ({
    index: vars.serverSetups.elastic.indices.presets,
    body: {
        from: 0,
        size: 6,
        query:{
           match:{
               "preset": true
            }
        }
    }
});

