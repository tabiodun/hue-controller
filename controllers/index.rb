get "/" do
  haml :index, :locals => {:action => "index"}
end