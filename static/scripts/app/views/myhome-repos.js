define([
    'jquery',
    'underscore',
    'backbone',
    'common',
    'js.cookie',
    'app/collections/repos',
    'app/views/repo',
    'app/views/add-repo',
], function($, _, Backbone, Common, Cookies, RepoCollection, RepoView, AddRepoView) {
    'use strict';

    var ReposView = Backbone.View.extend({
        id: "my-own-repos",

        template: _.template($('#my-own-repos-tmpl').html()),
        reposHdTemplate: _.template($('#my-repos-hd-tmpl').html()),

        events: {
            'click .repo-create': 'createRepo',
            'click .by-name': 'sortByName',
            'click .by-time': 'sortByTime'
        },

        initialize: function(options) {
            this.repos = new RepoCollection();
            this.listenTo(this.repos, 'add', this.addOne);
            this.listenTo(this.repos, 'reset', this.reset);

            this.render();
        },

        addOne: function(repo, collection, options) {
            var view = new RepoView({model: repo});
            if (options.prepend) {
                this.$tableBody.prepend(view.render().el);
            } else {
                this.$tableBody.append(view.render().el);
            }
        },

        renderReposHd: function() {
            this.$tableHead.html(this.reposHdTemplate());
        },

        reset: function() {
            this.$('.error').hide();
            this.$loadingTip.hide();
            if (this.repos.length) {
                this.$emptyTip.hide();
                this.renderReposHd();
                this.$tableBody.empty();
                this.sortRepos();
                this.repos.each(this.addOne, this);
                this.$table.show();
            } else {
                this.$table.hide();
                this.$emptyTip.show();
            }

            this.updateSortIconByMode();

            if (app.pageOptions.guide_enabled) {
                $('#guide-for-new').modal({appendTo: '#main', focus:false});
                $('#simplemodal-container').css({'height':'auto'});
                app.pageOptions.guide_enabled = false;
            }
        },

        showMyRepos: function() {
            this.$table.hide();
            this.$loadingTip.show();
            var _this = this;
            this.repos.fetch({
                cache: false, // for IE
                reset: true,
                success: function (collection, response, opts) {
                },
                error: function (collection, response, opts) {
                    _this.$loadingTip.hide();
                    var $error = _this.$('.error');
                    var err_msg;
                    if (response.responseText) {
                        if (response['status'] == 401 || response['status'] == 403) {
                            err_msg = gettext("Permission error");
                        } else {
                            err_msg = gettext("Error");
                        }
                    } else {
                        err_msg = gettext('Please check the network.');
                    }
                    $error.html(err_msg).show();
                }
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.$table = this.$('table');
            this.$tableHead = $('thead', this.$table);
            this.$tableBody = $('tbody', this.$table);
            this.$loadingTip = this.$('.loading-tip');
            this.$emptyTip = this.$('.empty-tips');
            this.$repoCreateBtn = this.$('.repo-create');
            return this;
        },

        show: function() {
            $("#right-panel").html(this.$el);
            this.showMyRepos();
        },

        hide: function() {
            this.$el.detach();
        },

        createRepo: function() {
            new AddRepoView(this.repos);
        },

        updateSortIconByMode: function() {
            var sort_mode = app.pageOptions.sort_mode;

            // first hide all icon
            this.$('.by-name .sort-icon, .by-time .sort-icon').hide();

            // show icon according sort mode
            if (sort_mode == 'name_down') {
                this.$('.by-name .sort-icon').removeClass('icon-caret-up').addClass('icon-caret-down').show();
            } else if (sort_mode == 'name_up') {
                this.$('.by-name .sort-icon').removeClass('icon-caret-down').addClass('icon-caret-up').show();
            } else if (sort_mode == 'time_down') {
                this.$('.by-time .sort-icon').removeClass('icon-caret-up').addClass('icon-caret-down').show();
            } else if (sort_mode == 'time_up') {
                this.$('.by-time .sort-icon').removeClass('icon-caret-down').addClass('icon-caret-up').show();
            } else {
                // if no sort mode, show name up icon
                this.$('.by-name .sort-icon').removeClass('icon-caret-down').addClass('icon-caret-up').show();
            }
        },

        sortRepos: function() {
            var sort_mode = app.pageOptions.sort_mode;

            // set collection comparator
            this.repos.comparator = function(a, b) {
                if (sort_mode == 'name_down' || sort_mode == 'name_up') {
                    // if sort by name
                    var result = Common.compareTwoWord(a.get('name'), b.get('name'));
                    if (sort_mode == 'name_down') {
                        return -result;
                    } else {
                        return result;
                    }
                } else {
                    // if sort by time
                    if (sort_mode == 'time_up') {
                        return a.get('mtime') < b.get('mtime') ? -1 : 1;
                    } else {
                        return a.get('mtime') < b.get('mtime') ? 1 : -1;
                    }
                }
            };

            // sort collection
            this.repos.sort();
        },

        sortByName: function() {
            if (app.pageOptions.sort_mode == 'name_up') {
                // change sort mode
                Cookies.set('sort_mode', 'name_down');
                app.pageOptions.sort_mode = 'name_down';
            } else {
                Cookies.set('sort_mode', 'name_up');
                app.pageOptions.sort_mode = 'name_up';
            }

            this.updateSortIconByMode();
            this.sortRepos();

            this.$tableBody.empty();
            this.repos.each(this.addOne, this);
            this.repos.comparator = null;

            return false;
        },

        sortByTime: function() {
            if (app.pageOptions.sort_mode == 'time_down') {
                // change sort mode
                Cookies.set('sort_mode', 'time_up');
                app.pageOptions.sort_mode = 'time_up';
            } else {
                Cookies.set('sort_mode', 'time_down');
                app.pageOptions.sort_mode = 'time_down';
            }

            this.updateSortIconByMode();
            this.sortRepos();

            this.$tableBody.empty();
            this.repos.each(this.addOne, this);
            this.repos.comparator = null;

            return false;
        }

    });

    return ReposView;
});
