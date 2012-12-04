get "/schedules" do
  haml :schedules, :locals => {:action => "schedules"}
end