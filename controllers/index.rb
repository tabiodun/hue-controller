get "/" do
  unless $config[:auth]
    return redirect to("/setup")
  end


end