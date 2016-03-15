var NewAppWindow = React.createClass({

    mixins: [React.LinkedStateMixin],

    countries : [],
    categories : [],

    app_data : {},

    icon_file : false,

    getInitialState : function() {
/*

      var userTimezone = jstz.determine().name();

        // Set timezone selection defaults to user's current timezone
        for (var countryCode in timezones) {
            for (var i = 0; i < timezones[countryCode].z.length; i++) {
                for (var countryTimezone in timezones[countryCode].z[i]) {
                    if (timezones[countryCode].z[i][countryTimezone] == userTimezone) {
                        initCountrySelect("#app-add-timezone", countryCode, countryTimezone, userTimezone);
                        break;
                    }
                }
            }
        }
*/
        var zones = countlyCommon.getTimeZones();
        var categories = countlyCommon.getAppCategories();

        for (var key in zones)
        {
            this.countries.push({
                "key" : key,
                "label" : zones[key].n,

            });
        };

        for (var key in categories)
        {
            this.categories.push({
                "key" : key,
                "label" : categories[key],

            });
        };

        return ({});

    },

    on_setting_change : function(key, value){
        this.app_data[key] = value;
    },

    add : function(){

        if (!this.icon_file)
        {
            alert("error");
            return false;
        }

        var self = this;

        this.setState({
            loading : true
        })

        console.log("--------- will add --------------");
        console.log({
            name : this.app_data.name,
            category : this.app_data.category,
            timezone : this.app_data.timezone,
            country  : this.app_data.country
        });

        this.props.onClose();

        $.ajax({
            type:"GET",
            url:countlyCommon.API_PARTS.apps.w + '/create',
            data:{
                args:JSON.stringify({
                    name : this.app_data.name,
                    category : this.app_data.category,
                    timezone : this.app_data.timezone,
                    country  : this.app_data.country
                }),
                api_key:countlyGlobal['member'].api_key
            },
            dataType:"jsonp",
            success:function (data) {

                var newAppObj = {
                    "_id":data._id,
                    "name":data.name,
                    "key":data.key,
                    "category":data.category,
                    "timezone":data.timezone,
                    "country":data.country
                };

                countlyGlobal['apps'][data._id] = newAppObj;
                countlyGlobal['admin_apps'][data._id] = newAppObj;

                // --------------------------------------------

                var new_app_id = data["_id"];

                //initAppManagement(new_app_id);

                console.log("new_app_id:", new_app_id);

                self.upload_image(new_app_id, function(error, result){

                    console.log("--- add finish ----");
                    console.log(result);

                    //initAppManagement(new_app_id);

                    self.props.onCreate(new_app_id);

                    self.setState({
                        loading : false
                    })
                });
            }})
    },

    cancel : function(){

        this.props.onClose();

        this.setState({

        });

    },

    handleFileChange: function(e){

        var file = this.refs.file.getDOMNode().files[0];

        if (!file)
        {
            return false;
        }

        this.icon_file = file;

    },

    upload_image : function(app_id, __callback){

        var file = this.icon_file;

        var fd = new FormData();
        fd.append('file', file);

        superagent
            .post('/apps/icon')
            .field('name', file.name)
            .field("app_image_id", app_id)
            .field('size', file.size)
            .attach('image', file, file.name)
            .set('Accept', 'application/json')
            .set('x-csrf-token', countlyGlobal['csrf_token'])
            .end(function(err, res){

                if (err)
                {
                    console.log(err);
                    return false;
                }

                var image_url = res.text;

                __callback(false, image_url);

            })

    },

    render : function(){

        if (this.state.loading)
        {
            return (<Loader/>);
        }

        var new_app_block_style = {
            width : get_viewport_width()
        };

        if (!this.props.open) new_app_block_style.display = "none";

        return(
            <div className="new_app_block" style={new_app_block_style}>

                <div className="label"></div>

                <InputBlock
                    label="app name"
                    value={""}
                    onChange={this.on_setting_change}
                    setting={["name"]}
                />

                <SelectBlock
                    label="Country"
                    selectors={this.countries}
                    active_selector_key={this.countries[0]}
                    onChange={this.on_setting_change}
                    setting={["country"]}
                />

                <SelectBlock
                    label="Category"
                    selectors={this.categories}
                    active_selector_key={this.categories[0]}
                    onChange={this.on_setting_change}
                    setting={["category"]}
                />

                <div className="setting_block upload_icon_block">
                    <div className="setting_label">Icon</div>
                    <div className="upload_block">

                        <form ref="uploadForm" enctype="multipart/form-data" id="add-app-image-form">
                            <input ref="file" type="file" id="app_image" name="app_image"  onChange={this.handleFileChange}/>
                        </form>

                    </div>
                </div>

                <div className="buttons_block">
                    <div className="cancel_button" onClick={this.cancel}>cancel</div>
                    <div className="add_button" onClick={this.add}>add</div>
                </div>
          </div>);
    }
});

var ApplicationsPage = React.createClass({

    app_categories : false,

    getInitialState: function() {

        var app_id = countlyCommon.ACTIVE_APP_ID;

        this.app_categories = countlyCommon.getAppCategories();
        var timezones = countlyCommon.getTimeZones();

        this.timezones_options = [];

        for (var key in timezones)
        {
            var timezone = timezones[key].z[0];

            //var timezone = value.z[0];

            var timezone_key = false;
            var timezone_value = false;

            for (var key in timezone)
            {
                timezone_key = timezone[key];//key;
                timezone_value = key;//timezone[key];
                break; // it is only one value
            }

            this.timezones_options[timezone_key] = timezone_value;

        }

        this.app_categories_options = [];

        for (var key in this.app_categories)
        {
            var value = this.app_categories[key];
            this.app_categories_options[key] = value;
        }

        var current_app = countlyGlobal['apps'][app_id];

        return({
            current_app : current_app,
            current_app_id : app_id,
            app_list_is_open : false,
            actions_list_is_open : false,
            new_app_open : false
        });

        /*
        {
            for (var app in countlyGlobal['apps'])
            {
                return (<div>{app.name}</div>)
            }
        }
        */

    },

    appListClick : function(){

        this.setState({
            app_list_is_open : !this.state.app_list_is_open
        })

    },

    actionsListClick : function(){

        this.setState({
            actions_list_is_open : !this.state.actions_list_is_open
        })

    },

    selectAppClick : function(id){

        console.log("selectAppClick:", id);

        var current_app = countlyGlobal['apps'][i];

        this.setState({
            current_app : current_app,
            current_app_id : current_app._id,
            app_list_is_open : false
        });

    },

    saveApp : function(props, state){

        var updated_app = this.state.current_app;

        if (state.value_key)
        {
            updated_app[props.save_key] = state.value_key;
        }
        else {
            updated_app[props.save_key] = state.value;
        }

        this.props.on_app_rename(updated_app);

            $.ajax({
                type:"GET",
                url:countlyCommon.API_PARTS.apps.w + '/update',
                data:{
                    args:JSON.stringify({
                        app_id : updated_app._id,
                        name : updated_app.name,
                        category : updated_app.category,
                        timezone : updated_app.timezone,
                        country : "CN" // todo!!!!!!!!!!!!!!!!!!
                    }),
                    api_key:countlyGlobal['member'].api_key
                },
                dataType:"jsonp",
                success:function (data) {

                    console.log("========= saved ==============");
                    console.log(data);

                }
            });

        /*});
*/
    },

    clearData : function(){

        var current_app = this.state.current_app;

        return false;

        CountlyHelpers.confirm(jQuery.i18n.map["management-applications.clear-confirm"], "red", function (result) {
            if (!result) {
                return true;
            }

            var appId = current_app._id;

            $.ajax({
                type:"GET",
                url:countlyCommon.API_PARTS.apps.w + '/reset',
                data:{
                    args:JSON.stringify({
                        app_id:appId,
                        period:period
                    }),
                    api_key:countlyGlobal['member'].api_key
                },
                dataType:"jsonp",
                success:function (result) {

                    if (!result) {
                        CountlyHelpers.alert(jQuery.i18n.map["management-applications.clear-admin"], "red");
                        return false;
                    } /*else {
                        if(period == "all"){
                            countlySession.reset();
                            countlyLocation.reset();
                            countlyCity.reset();
                            countlyUser.reset();
                            countlyDevice.reset();
                            countlyCarrier.reset();
                            countlyDeviceDetails.reset();
                            countlyAppVersion.reset();
                            countlyEvent.reset();
                        }
                        CountlyHelpers.alert(jQuery.i18n.map["management-applications.clear-success"], "black");
                    }*/
                }
            });
        });
    },

    deleteApp : function()
    {

        var self = this;

        console.log("=============== delte current app =================");
        console.log(self.state.current_app);

        //var current_app = this.state.current_app;

        CountlyHelpers.confirm(jQuery.i18n.map["management-applications.delete-confirm"], "red", function (result) {

            if (!result) {
                return true;
            }

            var appId = self.state.current_app._id;

            $.ajax({
                type:"GET",
                url:countlyCommon.API_PARTS.apps.w + '/delete',
                data:{
                    args:JSON.stringify({
                        app_id:appId
                    }),
                    api_key:countlyGlobal['member'].api_key
                },
                dataType:"jsonp",
                success:function () {

                    console.log("============ countlyGlobal['apps'] ===============");
                    console.log(countlyGlobal['apps']);

                    delete countlyGlobal['apps'][appId];
                    delete countlyGlobal['admin_apps'][appId];

                    var current_app = false/*countlyGlobal['apps'][0]*/;

                    for (var app_id in countlyGlobal['apps'])
                    {
                        current_app = countlyGlobal['apps'][app_id];
                        break;
                    }

                    console.log("{{{{{{{{{{{ current app }}}}}}}}}}}");
                    console.log(current_app);

                    self.setState({
                        current_app : current_app,
                        current_app_id : current_app._id,
                        actions_list_is_open : false
                    });

                    /*
                    var activeApp = $(".app-container").filter(function () {
                        return $(this).data("id") && $(this).data("id") == appId;
                    });

                    var changeApp = (activeApp.prev().length) ? activeApp.prev() : activeApp.next();
                    initAppManagement(changeApp.data("id"));
                    activeApp.fadeOut("slow").remove();

                    if (_.isEmpty(countlyGlobal['apps'])) {
                        $("#new-install-overlay").show();
                        $("#sidebar-app-select .logo").css("background-image", "");
                        $("#sidebar-app-select .text").text("");
                    }*/
                },
                error:function () {
                    CountlyHelpers.alert(jQuery.i18n.map["management-applications.delete-admin"], "red");
                }
            });
        });

    },

    new_app_click : function(){

        this.setState({
            new_app_open : !this.state.new_app_open
        })
    },

    new_app_close : function()
    {
        this.setState({
            new_app_open : false
        })
    },

    render : function(){

        var self = this;

        var elements_width = get_viewport_width();

        var page_style = {
            width : elements_width
        }

        var app_list_style = {}

        if (this.state.app_list_is_open)
        {
            app_list_style.display = "block";
        }
        else {
            app_list_style.display = "none";
        }

        var actions_list_style = {};

        if (this.state.actions_list_is_open)
        {
            actions_list_style.display = "block";
        }
        else {
            actions_list_style.display = "none";
        }

        var icon_style = {};

        icon_style["background-image"] = "url('/appimages/" + this.state.current_app._id + ".png')";

        var selector_logo_style = {
            "background-image" : "url('/appimages/" + this.state.current_app._id + ".png')"
        }

        var app_selectors = [];

        //countlyGlobal['apps'].forEach(function(app){

        for (var app_id in countlyGlobal['apps'])
        {

            app_selectors.push({
                "key" : app_id,
                "label" : countlyGlobal['apps'][app_id].name
            });

        };

        return (
            <div id="applications_page" style={page_style}>

                <div className="top_block">
                    <span className="sign">APPLICATIONS MANAGEMENT</span>
                    <div className="new_app_button" onClick={this.new_app_click}>Add New App</div>
                </div>

                <NewAppWindow open={this.state.new_app_open} onClose={this.new_app_close} onCreate={self.selectAppClick}/>

                <div className="wrapper">

                    <SimpleSelectBlock
                        selectors={app_selectors}
                        active_selector_key={self.state.current_app_id}
                        onChange={self.selectAppClick}
                        className="application_selector"
                    />

                    <div className="action_selector">
                        <div className="open_button" onClick={this.actionsListClick}>
                            <div className="sign">Action</div>
                            <div className="arrow"></div>
                        </div>
                        <div className="actions_list" style={actions_list_style}>
                            <div onClick={this.deleteApp}>Delete App</div>
                            <div onClick={this.clearData}>Clear Data</div>
                        </div>
                    </div>

                    <div className="application_block">

                        <span className="sign">APPLICATION DATA</span>

                        <div className="info_block">
                            <div className="table">
                                <span className="row">
                                    <span className="key">App ID</span>
                                    <span className="value">{this.state.current_app._id}</span>
                                </span>

                                <EditableField
                                    value_key={"App Name"}
                                    value={this.state.current_app.name}
                                    on_save={this.saveApp}
                                    save_key="name"
                                />

                                <span className="row">
                                    <span className="key">App Key</span>
                                    <span className="value">{this.state.current_app.key}</span>
                                </span>

                                <EditableField
                                    value_key={"Category"}
                                    value={this.state.current_app.category}
                                    options_values={this.app_categories_options}
                                    on_save={this.saveApp}
                                    save_key="category"
                                />

                                <EditableField
                                    value_key={"Time Zone"}
                                    value={this.state.current_app.timezone}
                                    options_values={this.timezones_options}
                                    on_save={this.saveApp}
                                    save_key="timezone"
                                />

                                <span className="row">
                                    <span className="key">IAP Event Key</span>
                                    <span className="value">101010test1010101</span>
                                </span>
                            </div>

                            <div className="icon_block">
                                <span className="sign">Icon</span>
                                <div className="icon" style={icon_style}></div>
                            </div>

                        </div>

                        <div className="sdk_block">
                            <span className="sign">Run Countly SDKs</span>
                            <span className="description">Countly has several SDKs to choose from. Some of them are supported by Countly, and others are contributed by Countly community.</span>
                            <a href="https://github.com/countly" className="button">Explore at Github</a>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
});
