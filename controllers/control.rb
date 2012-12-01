get "/control" do
  unless $config[:ip]
    return redirect to("/config")
  end

  haml :control, :locals => {:action => "control"}
end