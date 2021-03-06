var currentPath;
var uploadid;
var item = {'Parts': []};
var file_list = [];
var finished = 0;
var uploaded_size = [];
var parentPath;
var isfavorite = false;
var view_share = false;
var view_share_done = false;
var view_recent = false;
var available_size;
var used_size
var uploadaborted = false;
var view_list = false;

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}


$(document).ready(function () {
    //Show contextmenu:
    $(document).contextmenu(function (e) {
        //Get window size:
        var winWidth = $(document).width();
        var winHeight = $(document).height();
        //Get pointer position:
        var posX = e.pageX;
        var posY = e.pageY;
        //Get contextmenu size:
        var menuWidth = $(".contextmenu").width();
        var menuHeight = $(".contextmenu").height();
        //Security margin:
        var secMargin = 10;
        //Prevent page overflow:
        if (posX + menuWidth + secMargin >= winWidth
            && posY + menuHeight + secMargin >= winHeight) {
            //Case 1: right-bottom overflow:
            posLeft = posX - menuWidth - secMargin + "px";
            posTop = posY - menuHeight - secMargin + "px";
        } else if (posX + menuWidth + secMargin >= winWidth) {
            //Case 2: right overflow:
            posLeft = posX - menuWidth - secMargin + "px";
            posTop = posY + secMargin + "px";
        } else if (posY + menuHeight + secMargin >= winHeight) {
            //Case 3: bottom overflow:
            posLeft = posX + secMargin + "px";
            posTop = posY - menuHeight - secMargin + "px";
        } else {
            //Case 4: default values:
            posLeft = posX + secMargin + "px";
            posTop = posY + secMargin + "px";
        }
        ;
        //Display contextmenu:
        $(".contextmenu").css({
            "left": posLeft,
            "top": posTop
        }).show();
        //Prevent browser default contextmenu.
        return false;
    });
    //Hide contextmenu:
    $(document).click(function () {
        $(".contextmenu").hide();
    });

});

function goMainPage() {
    window.history.pushState("", "", '/list/');
    list_files('','/');
}

function printsize() {
    var kb = 1024;
    var mb = 1048576;
    var gb = 1073741824;
    var us = used_size;
    var as = available_size + used_size;
    $(".over_rocket").css("clip","rect(calc(("+available_size+" - " + used_size + ") / " + available_size + " * 137.5 * 1px) 137.5px 137.5px 0px)")
    if (us / gb >= 1) {
        $(".size").html((us / gb).toFixed(2) + " GB/ " + (as / gb).toFixed(2) + " GB");
    } else if (us / mb >= 1) {
        $(".size").html((us / mb).toFixed(2) + " MB/ " + (as / gb).toFixed(2) + " GB");
    } else if (us / kb >= 1) {
        $(".size").html((us / kb).toFixed(2) + " KB/ " + (as / gb).toFixed(2) + " GB");
    } else {
        $(".size").html(us + " B/ " + as / gb + " GB");
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function byteTosize(byte){
    var result = byte + "Byte";
    if(byte > 1024 && byte < 1024*1024){
        result = byte/1024;
        result = result.toFixed(2);
        result = result + "KB";
    } else if(byte >= 1024*1024 && byte < 1024*1024*1024) {
        result = byte/(1024*1024);
        result = result.toFixed(2);
        result = result + "MB";
    } else if(byte >= 1024*1024*1024 && byte < 1024*1024*1024*1024) {
        result = byte/(1024*1024*1024);
        result = result.toFixed(2);
        result = result + "GB";
    }
    return result;
}

function list_files(recently, path) {
    currentPath = path;
    var ppath = "/"
    var url = '/api/list'+path;
    view_share = false;
    view_share_done = false;
    if(recently!=""){
        url = "/api/list?recently="+recently;
    } else {
        isfavorite = false;
        view_recent = false;
    }
    $.ajax({
            method: "GET",
            url: url,
            success: function (data) {
                var html = "/"+"<a style=\"cursor: pointer;\" onclick=\"list_files('','"+ppath+"'); window.history.pushState('', '', '/list" + ppath + "');\">HOME</a>" + "/";

                if(recently == "")
                {
                    var splited_path = path.split('/');
                    for(var i = 1;i < splited_path.length-1; i++) {
                        ppath += splited_path[i] + "/"
                        html += "<a style=\"cursor: pointer;\" onclick=\"list_files('','" + ppath + "'); window.history.pushState('', '', '/list" + ppath + "');\">" + splited_path[i] + "</a>" + "/";
                    }
                    parentPath = data['parent'];
                    available_size = data['available_size'];
                    used_size = data['used_size'];

                    load_files('', data['items'], path);
                    $("#current_path").html(html);
                    var checkeditems = findCheckedItems();
                    if(checkeditems.length == 0){
                        $(".delete").attr("hidden",true);
                        $(".share").attr("hidden",true);
                        $(".copy").attr("hidden",true);
                        $(".move").attr("hidden",true);
                    } else {
                        $(".delete").attr("hidden", false);
                        $(".share").attr("hidden",false);
                        $(".copy").attr("hidden",false);
                        $(".move").attr("hidden",false);
                    }
                    printsize();

                }
                else
                {
                    load_files(recently, data['items'], path);
                }
            },
            error: function (data) {
                goMainPage();
                makeSnackBar("An error occured, please try again later", 3000)
            }
    });
}

function list_share() {
    view_recent = false;
    view_share_done = false;
    var id = getParameterByName('id');
    var loc = '/api/listshare/';
    if(id != null)
        loc = loc+"?id="+id;
    $.ajax({
        method: "GET",
        url: loc,
        success: function (data) {
            parentPath = data['parent'];
            file_list = data['items'];
            load_files("",file_list);
            available_size = data['available_size'];
            used_size = data['used_size'];

            printsize();
        },
        error: function (data) {
            goMainPage();
            makeSnackBar("An error occured, please try again later", 3000)
        },
        async: false
    });
}

function list_link() {
    var id = getParameterByName('id');
    var loc = '/api/listshare/';
    if(id != null)
        loc = loc+"?id="+id+"&link=true";
    else
        return;
    $.ajax({
        method: "GET",
        url: loc,
        success: function (data) {
            parentPath = data['parent'];
            file_list = data['items'];
            load_files("",file_list);
        },
        error: function (data) {
            $("#error").html("잘못된 요청입니다");
        },
        async: false
    });
}


function list_do_share() {
    view_recent = false;
    view_share = false;
    view_share_done = true;
    var loc = '/api/listdoshare/';
    $.ajax({
        method: "GET",
        url: loc,
        success: function (data) {
            parentPath = data['parent'];
            file_list = data['items'];
            load_files("",file_list);
            available_size = data['available_size'];
            used_size = data['used_size'];

            printsize();
        },
        error: function (data) {
            goMainPage();
            makeSnackBar("An error occured, please try again later", 3000)
        },
        async: false
    });
}

function list_modal(path, method) {
    var url = '/api/list'+path;
        $.ajax({
            method: "GET",
            url: url,
            success: function (data) {
                load_files_modal(data['items'], path, data['parent'], method);

            },
            error: function (data) {
                goMainPage();
                makeSnackBar("An error occured, please try again later", 3000)
            }
    });
}

function dateToString(date) {
    var year = date.substring(0, 10);
    var time = date.substring(11,16);
    return year + " " + time;
}

function load_files_modal(files, cur_path, parent_path, method) {
    var ppath = "/";
    var html = "/" + "<a style=\"cursor: pointer;\" onclick=\"list_modal('/','"+method+"'); \">HOME</a>" + "/";
    var splited_path = cur_path.split('/');
    for (var i = 1; i < splited_path.length - 1; i++) {
        ppath += splited_path[i] + "/";
        html += "<a style=\"cursor: pointer;\" onclick=\"list_modal('" + ppath + "','"+method+"');\">" + splited_path[i] + "</a>" + "/";
    }
    if(method=="move")
    {
        $("#movePath").html(html);
        $("#movefiles").html("");
    }
    else{
        $("#copyPath").html(html);
        $("#copyfiles").html("");
    }

    var html = "";
    var name;
    var isDirectory;
    var path

    if (cur_path != "/") {
        html += "<tr class='hover'>";
        html += "<td style='text-align: left;'><a class='file' onclick=\"list_modal('"+parent_path+"','"+method+"');\" style=\"cursor: pointer;\">..</a></td>";
        html += "</tr>";
    }
    for (var i = 0; i < files.length; i++) {
        isDirectory = files[i]['is_directory'];
        if (isDirectory) {
            name = files[i]['name'];
            path = files[i]['path']
            html += "<tr class='hover'>";
            html += "<td style='text-align: left;'><a class='file' id='file"+ i + "'style=\"cursor: pointer;\" onclick=\"list_modal('"+path+"','"+method+"');\">" + name + "/</a></td>";
            html += "</tr>";
        }
    }
    if(method=="move")
    {
        $("#movefiles").html(html);
    }
    else{
        $("#copyfiles").html(html);
    }
}

function load_files(value, files, cur_path) {
    var html = "";
    var checked = findCheckedItems();
    $("#items").html("");
    var name;
    var modified;
    var displayname
    var path;
    var isDirectory;
    var file_id
    var prev_checked= [];
    if (cur_path != "/" || isfavorite || view_share || view_recent || view_share_done) {
        html += "<tr class='hover'>";
        html += "<td></td>";
        var id = getParameterByName('id');
        if(isfavorite){
            html += "<td style='text-align: left;'><a class='file' onclick=\"list_files('','/');\" style=\"cursor: pointer;\">..</a></td>";
        } else if(view_share || view_share_done || view_list)
        {
            if(parentPath != '' && id != null)
                if(!view_list)
                    html += "<td style='text-align: left;'><a class='file' onclick=\"window.history.pushState('', '', '/listshare/?id=" + parentPath + "'); list_share();\" style=\"cursor: pointer;\">..</a></td>";
                else
                    html += "<td style='text-align: left;'><a class='file' onclick=\"window.history.pushState('', '', '/link/?id=" + parentPath + "'); list_link();\" style=\"cursor: pointer;\">..</a></td>";
            else if(parentPath == '' && id != null)
                if(!view_list)
                    html += "<td style='text-align: left;'><a class='file' onclick=\"window.history.pushState('', '', '/listshare/'); list_share();\" style=\"cursor: pointer;\">..</a></td>";
            else
                if(!view_list)
                    html += "<td style='text-align: left;'><a class='file' href='/list/' >..</a></td>";
        }
        else {
            html += "<td style='text-align: left;'><a class='file' id='fuck' onclick=\"list_files('','"+parentPath+"'); window.history.pushState('', '', '/list"+parentPath+"');\" style=\"cursor: pointer;\">..</a></td>";
        }

        html += "<td></td>";
        html += "<td></td>\n";
        html += "</tr>";
    }

    for (var i = 0; i < files.length; i++) {
        isDirectory = files[i]['is_directory'];
        if (isDirectory) {
            name = files[i]['name'];
            modified = files[i]['modified'];
            path = files[i]['path'];
            file_id = files[i]['id'];

            if(value=="")
                displayname = name + "/";
            else
                displayname = path;
            html += "<tr class='hover list_file'>";
            html += "<td><input type='checkbox' id='checkbox"+(i+1)+"' class='check' hidden='false'/></td>";
            if(checked.indexOf(path)>=0 && !isfavorite && !view_recent && !view_share){
                prev_checked.push("#checkbox"+(i+1));
            }
            if(view_share)
                html += "<td style='text-align: left;'><a class='file' onclick=\"window.history.pushState('', '', '/listshare/?id=" + file_id + "'); list_share();\" style=\"cursor: pointer;\">" + displayname + "</a></td>";
            else if(view_list)
                html += "<td style='text-align: left;'><a class='file' onclick=\"window.history.pushState('', '', '/link/?id=" + file_id + "'); list_link();\" style=\"cursor: pointer;\">" + displayname + "</a></td>";
            else if(view_share_done)
                html += "<td style='text-align: left;'><a class='file' onclick=\"window.location.href='/list"+path+"'\" style=\"cursor: pointer;\">" + displayname + "</a></td>";
            else
                html += "<td style='text-align: left;'><a class='file' id='file"+ i + "'style=\"cursor: pointer;\" onclick=\"list_files('','"+path+"'); window.history.pushState('', '', '/list"+path+"');\">" + displayname + "</a></td>";
            html += "<td>" + dateToString(modified) + "</td>";
            html += "<td>folder</td>";
            if(!view_share && !view_share_done && !view_list){
                if(!files[i]['favorite'])
                    html += "<td id='star' style='cursor:default'>★</td>\n";
                else
                    html += "<td id='star' style='cursor:default; color:orange;'>★</td>\n";
            } else {
                if(view_share || view_list)
                    html += "<td>"+ files[i]['owner'] + "</td>\n";
                else
                    html += "<td>" + files[i]['shared_user'] + "</td>\n";
            }

            html += "<td id='path' hidden>" + files[i]['path'] + "</td>";
            if(view_share_done || view_list)
                html += "<td id='shared_id' hidden>" + files[i]['shared_id'] + "</td>";
            html += "</tr>";
        }
    }
    for (var i = 0; i < files.length; i++) {
        isDirectory = files[i]['is_directory'];
        if (!isDirectory) {

            name = files[i]['name'];
            modified = files[i]['modified'];
            path = files[i]['path'];
            file_id = files[i]['id'];
            isDirectory = files[i]['is_directory'];
            if(value=="")
                displayname = name;
            else
                displayname = path;
            html += "<tr class='hover list_file'>";
            html += "<td><input type='checkbox' id='checkbox"+(i+1)+"' class='check' hidden='false'/></td>";
            if(checked.indexOf(path)>=0 && !isfavorite && !view_recent && !view_share){
                prev_checked.push("#checkbox"+(i+1));
            }
            if(view_share)
                html += "<td style='text-align: left;'><a class='file' href='/download/share/?id=" + file_id + "'>" + displayname + "</a></td>";
            else if(view_list)
                html += "<td style='text-align: left;'><a class='file' href='/download/share/?link=true&id=" + file_id +"'>" + displayname + "</a></td>";
            else
                html += "<td style='text-align: left;'><a class='file' href='/download" + path + "'>" + displayname + "</a></td>";

            html += "<td>" + dateToString(modified) + "</td>";
            html += "<td>file</td>";
            if(!view_share && !view_share_done && !view_list){
                if(!files[i]['favorite'])
                    html += "<td id='star' style='cursor:default'>★</td>\n";
                else
                    html += "<td id='star' style='cursor:default; color:orange;'>★</td>\n";
            } else {
                if(view_share || view_list)
                    html += "<td>"+ files[i]['owner'] + "</td>\n";
                else
                    html += "<td>" + files[i]['shared_user'] + "</td>\n";
            }

            html += "<td id='path' hidden>" + files[i]['path'] + "</td>";
            if(view_share_done || view_list)
                html += "<td id='shared_id' hidden>" + files[i]['shared_id'] + "</td>";
            html += "</tr>";

        }

    }
    $("#items").html(html);
    for(c in prev_checked){
        $(prev_checked[c]).attr('checked',true).change();
    }
}


function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("Table");
    switching = true;
    dir = "asc";
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

function make_upload(file_len, file_num, path, snackbar_id) {
    uploadaborted = false;
    var urls;
    if(file_len > file_num && !uploadaborted){

        var unloadHandler = function () {
            uploadaborted = true;
            $.post('/api/upload_abort/', {
                        'name': $("#uploadInput")[0].files[file_num].name,
                        'path': path,
                        'uploadid': uploadid
            });
            closeSnackBar(snackbar_id);
            $("#uploadeditem").html("");
            $("#uploadInput").val("");
            makeSnackBar("업로드 중단", 3000);
            $("#uploadBtn").show();
            $("#abortBtn").attr("hidden",'');

        }

        window.onunload = function() {
            unloadHandler();
            alert('Bye.');
        }

        $(document).on('click','#abortBtn', function() {
           unloadHandler();
        });
        $.ajax({
            method: "POST",
            data: {
                'name': $("#uploadInput")[0].files[file_num].name,
                'is_directory': false,
                'path': path,
                'size': $("#uploadInput")[0].files[file_num].size
            },
            url: '/api/upload_start/',
            success: function (data) {
                urls = data['url'];
                uploadid = data['uploadid'];
                if(file_num==0){
                    $("#uploadModal").modal('toggle');
                    $("#uploadBtn").hide();
                    $("#abortBtn").removeAttr("hidden");
                }
            },
            error: function (data) {
                makeSnackBar("An error occured, please try again later", 3000)
                goMainPage();
            }
        }).done(function () {
            finished = 0;
            $('#uploadProgress'+file_num).val(0).show();
            var slice_length = 1024 * 1024 * 1024 * 5;
            var processed = 0;
            var len_url = Object.keys(urls).length;
            var chunk_num = 1;
            var len_file = $("#uploadInput")[0].files[file_num].size;
            item = {'Parts': []};
            uploaded_size = [];
            for (url in urls) {
                uploaded_size.push(0);
            }
            for (url in urls) {
                filedata = $("#uploadInput")[0].files[file_num].slice(processed, processed + slice_length);
                upload_file(urls[url], filedata, chunk_num, len_url, len_file, file_num, file_len, path, snackbar_id);
                processed = processed + slice_length;
                chunk_num++;
            }
        });
    } else {
        $("#uploadBtn").show();
        $("#abortBtn").attr("hidden",'');
        $(document).on('click','#abortBtn', function() {

        });
        closeSnackBar(snackbar_id);
        makeSnackBar("업로드 완료", 3000);
        $("#uploadeditem").html("");
        $("#uploadInput").val("");
    }
}

function upload_file(url, filedata, chunk_id, len_url, len_file, file_num, file_len, path, snackbar_id) {
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", function (e) {
        if(uploadaborted){
            closeSnackBar(snackbar_id);
            xhr.abort();
            return;
        }
        uploaded_size[chunk_id - 1] = e.loaded;
        var sum = 0;
        for (var i = 0; i < len_url; i++) {
            sum = sum + uploaded_size[i];
        }
        var per = sum * 100 / len_file;
        $('#uploadProgress'+file_num).val(per);

        var display_len = byteTosize(len_file);
        var display_sum = byteTosize(sum);
        $('#size'+file_num).html(display_sum+'/'+display_len);
        changeSnackBarContent(snackbar_id,"<td id=\"snackbar_content\">"+ (file_num+1) + "/" + file_len + "  " + $("#uploadInput")[0].files[file_num].name + "   " + "<progress max=\"100\" value=\"0\" id=\"snackprogress\"></progress>" + "   " + display_sum + "/" + display_len + "</td><td id=\"abortBtn\"><button type=\"button\" class=\"btn btn-default btn-block\" id=\"abortBtn\" style=\"color: white;\">x</button></td>");
        $('#snackprogress').val(per);

    });


    xhr.open("PUT", url);
    xhr.send(filedata);
    xhr.onreadystatechange = function () {
        if (this.readyState == this.HEADERS_RECEIVED) {
            var etag = xhr.getResponseHeader("ETag");
            etag = etag.replace("/\"/gi", "");
            item['Parts'].push({'ETag': etag, 'PartNumber': chunk_id});
            finished++;
            if (finished == len_url) {
                window.onbeforeunload = null;

                $.ajax({
                    method: "POST",
                    data: {
                        'name': $("#uploadInput")[0].files[file_num].name,
                        'path': path,
                        'uploadid': uploadid,
                        'size': len_file,
                        'items': JSON.stringify(item)
                    },
                    url: '/api/upload_complete/',
                    success: function (data) {
                        window.onunload=null;
                        list_files("", currentPath);
                        make_upload($("#uploadInput")[0].files.length, file_num+1, path, snackbar_id);
                    },
                    error: function (data) {
                        goMainPage();
                        makeSnackBar("An error occured, please try again later", 3000)
                    }
                });
            }
        }
    }
}
var removed = 0;
function remove_file(items, file_len, file_num) {
        $.ajax({
            method: "POST",
            data: {
                'path': items[file_num]
            },
            url: '/api/delete/',
            success: function (data) {
                removed++;
                makeSnackBar("삭제중...", 3000);
                $("#removed"+file_num).html("deleted");
                list_files("", currentPath);
            },
            error: function (data) {
                goMainPage();
                makeSnackBar("An error occured, please try again later", 3000)
            }
        });
}

function remove_share(items, file_len, file_num) {
        $.ajax({
            method: "POST",
            data: {
                'id': items[file_num]
            },
            url: '/api/removeshare/',
            success: function (data) {
                removed++;
                makeSnackBar("삭제중...", 3000);
                $("#removed"+file_num).html("deleted");
                list_do_share();
            },
            error: function (data) {
                goMainPage();
                makeSnackBar("An error occured, please try again later", 3000)
            }
        });
}

var moved_file = 0;
function move_file(items, file_len, file_num, from, to, id) {
        $.ajax({
            method: "POST",
            data: {
                'from_path': items[file_num],
                'to_path': to
            },
            url: '/api/move/',
            success: function (data) {
                moved_file++;
                if(moved_file == file_len)
                    closeSnackBar(id);
                list_files('', currentPath);
                makeSnackBar(items[file_num] + ": 이동완료", 3000);
            },
            error: function (data) {
                moved_file++;
                if(moved_file == file_len)
                    closeSnackBar(id);
                goMainPage();
                makeSnackBar(items[file_num] +": 이 작업은 허용되지 않습니다", 3000);
            }
        });
}

var copied_file = 0;
function copy_file(items, file_len, file_num, from, to, id) {
        $.ajax({
            method: "POST",
            data: {
                'from_path': items[file_num],
                'to_path': to
            },
            url: '/api/copy/',
            success: function (data) {
                copied_file++;
                if(copied_file == file_len)
                    closeSnackBar(id);
                list_files('', currentPath);
                makeSnackBar(items[file_num] + ": 복사완료", 3000);
            },
            error: function (data) {
                copied_file++;
                if(copied_file == file_len)
                    closeSnackBar(id);
                goMainPage();
                makeSnackBar(items[file_num] +"  이 작업은 허용되지 않습니다", 3000);
            }
        });
}

var shared = 0;
function share_file(items, file_len, file_num, email) {
        $.ajax({
            method: "POST",
            data: {
                'path': items[file_num],
                'email': email
            },
            url: '/api/share/',
            success: function (data) {
                shared++;
                if(shared == file_len) {
                    $("#shareModal").modal("toggle");
                    makeSnackBar(file_len + "개의 파일이 공유되었습니다", 3000);
                }
            },
            error: function (data) {
                if(data['responseJSON']['error'] == "Already Shared")
                {

                }
                    //showSnackBar("이미 공유 되었습니다.");
                else if(data['responseJSON']['error'] == 'Cannot share to owner')
                    makeSnackBar("자신에게는 공유할 수 없습니다", 3000);
                else
                    makeSnackBar("존재하지 않는 Email입니다", 3000);
            }
        });
}


function changeSnackBarContent(id, text){
    $("#"+id).html(text);
}

function CreateUploadSnackBar() {
    var options = {
        content: "",
        timeout: 0,
        htmlAllowed: true
    };
    var id = $.snackbar(options)[0].id;
    return id;
}

function makeSnackBar(text, timeout) {
    var options = {
        content: text,
        timeout: timeout,
        htmlAllowed: true
    };
    var id = $.snackbar(options)[0].id;
    $("#"+id).snackbar("show");
    return id;
}

function closeSnackBar(id) {
    // Get the snackbar DIV
    $("#"+id).html("");
    $("#"+id).snackbar("hide");
}

function findCheckedItems() {
    var checked_items = [];
    $('input[type="checkbox"]:checked').each(function() {
        var item = $(this).closest(".hover").find("#path").html();
        if(item != null)
           checked_items.push(item);
    });
    return checked_items;
}

function findCheckedItemsUUID() {
    var checked_items = [];
    $('input[type="checkbox"]:checked').each(function() {
        var item = $(this).closest(".hover").find("#shared_id").html();
        if(item != null)
           checked_items.push(item);
    });
    return checked_items;
}

$(document).on('click', '#uploadBtn', async function () {
    var id = CreateUploadSnackBar();
    make_upload($("#uploadInput")[0].files.length, 0, currentPath, id);
});

$(document).on('click', '#createBtn', async function () {

    $.ajax({
        method: "POST",
        data: {
            'name': $("#directoryName").val(),
            'path': currentPath
        },
        url: '/api/create/',
        success: function (data) {
            $("#createDirectoryModal").modal("toggle");
            makeSnackBar("폴더 생성완료", 3000);
            list_files("", currentPath);
        },
        error: function (data) {
            if(data.responseJSON['error']=='Already Exist')
                makeSnackBar("이미 존재하는 폴더입니다")
            else
                makeSnackBar("An error occured, please try again later", 3000)
            goMainPage();
        }
    });
});

$(document).on('change', '#uploadInput', function(){

    var files = $("#uploadInput")[0].files;
    $("#uploadeditem").html("");
    var html="";
    for(var i=0;i<files.length;i++) {
        var size = files[i].size;
        var display_size = byteTosize(size);
        html += "<tr class=\"hover\"><td style=\"text-align: left;\">"+files[i].name+"</td><td><progress max=\"100\" value=\"0\" id=\"uploadProgress"+i+"\"></progress></td><td style='text-align: left;'><span id='size"+i+"'>0/"+display_size+"</span></td></tr>";
    }
    $("#uploadeditem").html(html);
});

$(document).on('mouseover','.hover', function() {
    $(this).find(".check").attr("hidden",false);
})

$(document).on('mouseout','.hover', function() {
    var checked =  $(this).find(".check").prop('checked');
    if(!checked)
        $(this).find(".check").attr("hidden",true);
})

$(document).on('click', '#star', function () {
    var name = $(this).parent().find(".file").html()
    var result;
    $.ajax({
        method: "POST",
        data: {
            'path': currentPath + name
        },
        url: '/api/favorite/',
        success: function (data) {
            result = data;
        },
        error: function (data) {
            goMainPage();
            makeSnackBar("An error occured, please try again later", 3000)
        },
        async: false
    });
    if (result['favorite']) {
        $(this).css('color', 'orange');
        $(this).css('cursor', 'default');
    } else {
        $(this).css('color', 'black');
        $(this).css('cursor', 'default');
    }
});

$(document).on('click', '#stars', function () {
    window.history.pushState("", "", '/list/');

    view_share=false;
    view_share_done=false;
    $.ajax({
        method: "GET",
        url: '/api/listfavorite/',
        success: function (data) {
            isfavorite = true;
            load_files("",data['items']);
        },
        error: function (data) {
            goMainPage();
            makeSnackBar("An error occured, please try again later", 3000)
        },
        async: false
    });
});

$(document).on('change','.check',function() {

    var filename = $(this).closest('.hover').find('#path').html();
    var checked = $(this).prop('checked');  // checked 상태 (true, false)
    var checked_items = findCheckedItems();
    if(checked)
    {
        if(!view_share && !view_share_done){
            $(".delete").attr("hidden",false);
            $(".share").attr("hidden",false);
            $(".move").attr("hidden",false);
            $(".copy").attr("hidden",false);
        }
        if(view_share_done){
            $(".removeshare").attr("hidden",false);
        }


        $(this).attr("hidden",false);
    }
    else
    {
        $(this).attr("hidden",true)
        if(checked_items.length==0){
            if(!view_share && !view_share_done){
                $(".delete").attr("hidden",true);
                $(".share").attr("hidden",true);
                $(".move").attr("hidden",true);
                $(".copy").attr("hidden",true);
            }
            if(view_share_done){
                $(".removeshare").attr("hidden",true);
            }
        }
    }
});


$(document).on('click','#allCheck',function() {

    var checked = $(this).prop('checked');  // checked 상태 (true, false)

    if(checked)
        $("input[type=checkbox]").prop("checked",true).change();
    else
        $("input[type=checkbox]").prop("checked",false).change();
});

$(document).on('click','#removeItem', function() {
    $('#deleteModal').modal();
    var checked_items = findCheckedItems();
    var html="";
    for(var i=0;i<checked_items.length;i++) {
        html += "<tr class=\"hover\"><td style=\"text-align: left;\">"+checked_items[i]+"</td><td style='text-align: left;'><span id='removed"+i+"'></span></td></tr>";
    }
    $('#deleteModal').find("#deleteditem").html(html);

});

$(document).on('click','#removeShare', function() {
    $('#removeshareModal').modal();
    var checked_items = findCheckedItems();
    var html="";
    for(var i=0;i<checked_items.length;i++) {
        html += "<tr class=\"hover\"><td style=\"text-align: left;\">"+checked_items[i]+"</td><td style='text-align: left;'><span id='removed"+i+"'></span></td></tr>";
    }
    $('#removeshareModal').find("#removeshareItem").html(html);

});

$(document).on('click','#deleteBtn', function() {
    var path;
    var items = findCheckedItems();
    removed = 0;
    $("#deleteModal").modal('toggle');
    for(var i = 0; i<items.length;i++) {
        remove_file(items, items.length, i);
    }
});

$(document).on('click','.move', function() {
    $("#movefiles").html("");
    list_modal('/', 'move');
});

$(document).on('click','.copy', function() {
    $("#copyfiles").html("");
    list_modal('/', 'copy');
});

$(document).on('click','#moveBtn', function() {
    moved_file = 0;
    var id = makeSnackBar("이동중..", 0);
    var path = $("#movePath").text().substring(5);
    var items = findCheckedItems();
    removed = 0;
    $("#moveModal").modal('toggle');
    for(var i = 0; i<items.length;i++) {
        move_file(items, items.length, i, currentPath, path, id);
    }
});

$(document).on('click','#copyBtn', function() {
    copied_file = 0;
    var id = makeSnackBar("복사중..", 0);
    var path = $("#copyPath").text().substring(5);
    var items = findCheckedItems();
    removed = 0;
    $("#copyModal").modal('toggle');
    for(var i = 0; i<items.length;i++) {
        copy_file(items, items.length, i, currentPath, path, id);
    }
});

$(document).on('click','#removeShareBtn', function() {
    var path;
    var items = findCheckedItemsUUID();
    removed = 0;
    $("#removeshareModal").modal('toggle');
    for(var i = 0; i<items.length;i++) {
        remove_share(items, items.length, i);
    }
});

$(document).on('input','#search', async function() {
    if ($("#search").val() != "")
    {
        $.ajax({
            method: "GET",
            data: {
                'name': $("#search").val()
            },
            url: '/api/search'+currentPath,
            success: function (data) {
                 load_files($("#search").val(), data['items'])
            },
            error: function (data) {
                goMainPage();
                makeSnackBar("An error occured, please try again later", 3000)
            }
        });
    } else {
        list_files("", currentPath);
    }
});

$(document).on('click','#shareBtn', function() {
    var path;

    var items = findCheckedItems();
    shared = 0;
    for(var i = 0; i<items.length;i++) {
        share_file(items, items.length, i, $("#emailInput").val());
    }
});

$(document).on('click','#recent', function() {
    view_recent = true;
    list_files("modified");
});

$(document).on('click','#added', function() {
    view_recent = true;
    list_files("created");
});

$(document).on('click','#snackbar_content', function() {
    $('#uploadModal').modal('toggle');
});

$(document).on('hide.bs.modal', '#shareModal', function() {
    $("#shareresult").html("");
});

$(document).on('hide.bs.modal', '#uploadModal', function() {
});

$(document).on('hide.bs.modal', '#createDirectoryModal', function() {
    $("#directoryName").val("");
});

$(document).on('hide.bs.modal', '#removeshareModal', function() {
    $("#removeshareItem").val("");
});

$(document).on('hide.bs.modal', '#deleteModal', function() {
    $("#deleteditem").html("");
});

$(document).on('click','#resetBtn', function() {
    $.ajax({
        method: "POST",
        data: {
            'current_password': $("#current_password").val(),
            'password': $("#password").val(),
            'password_conf': $("#password_conf").val()
        },
        url: '/api/reset/',
        success: function (data) {
            $("#userInfoModal").find("#message").html("변경이 완료되었습니다");
        },
        error: function (data) {
            $("#userInfoModal").find("#message").html(data.responseJSON['result']);
        }
    });
});

window.onpopstate = function(event) {
    if(window.location.pathname=="/listshare/") {
        list_share();
    }
    else if(!view_recent){
        list_files('',window.location.pathname.substring(5));
    }
  console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
};

$(document).on('click', '.share', function() {
    var checked__items = findCheckedItems();
    if(checked__items.length == 1)
        $("#linkshareBtn").attr('hidden',false);
    else
        $("#linkshareBtn").attr('hidden',true);
});

$(document).on('click', '#linkshareBtn', function() {
    var checked__items = findCheckedItems();
    if(checked__items.length == 1){
        $.ajax({
            method: "POST",
            data: {
                'path': checked__items[0],
                'link': true
            },
            url: '/api/share/',
            success: function (data) {
                $("#shareresult").html("<input type='text' id='urlresult' readonly style=\"width: 60%;\"></input><button onclick=\"linkCopy()\">복사</button>");
                var url = window.location.hostname+"/link/?id="+data['file_id'];
                $("#urlresult").val(url);
                makeSnackBar("링크가 공유되었습니다", 3000);
            },
            error: function (data) {
                makeSnackBar("에러가 발생하였습니다.", 3000);
            }
        });
    }
});

function linkCopy() {
  var copyText = document.getElementById("urlresult");
  copyText.select();
  document.execCommand("copy");
  makeSnackBar("복사됨: "+copyText.value,3000);
}